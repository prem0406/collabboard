import { Response } from "express";
import prisma from "../config/prisma";
import { WorkspaceRequest } from "../middleware/workspace-access.middleware";
import { getIO } from "../socket";

export async function createCard(req: WorkspaceRequest, res: Response) {
  const { listId } = req.params;
  const { title, description } = req.body;
  const boardId = req.boardId!;

  if (!title) return res.status(400).json({ error: "Card title is required" });

  const lastCard = await prisma.card.findFirst({
    where: { listId },
    orderBy: { position: "desc" },
  });
  const position = lastCard ? lastCard.position + 1 : 0;

  const card = await prisma.card.create({
    data: { title, description, listId, position },
  });

  getIO().to(`board:${boardId}`).emit("card:created", { listId, card });

  res.status(201).json(card);
}

export async function updateCard(req: WorkspaceRequest, res: Response) {
  const { cardId } = req.params;
  const { title, description } = req.body;
  const boardId = req.boardId!;

  const card = await prisma.card.update({
    where: { id: cardId },
    data: { title, description },
  });

  getIO().to(`board:${boardId}`).emit("card:updated", { card });

  res.json(card);
}

export async function deleteCard(req: WorkspaceRequest, res: Response) {
  const { cardId } = req.params;
  const boardId = req.boardId!;

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { listId: true },
  });
  if (!card) return res.status(404).json({ error: "Card not found" });

  await prisma.card.delete({ where: { id: cardId } });

  getIO()
    .to(`board:${boardId}`)
    .emit("card:deleted", { cardId, listId: card.listId });

  res.status(204).send();
}

export async function reorderCard(req: WorkspaceRequest, res: Response) {
  const { cardId } = req.params;
  const {
    destinationListId,
    orderedCardIds,
    sourceListId,
    sourceOrderedCardIds,
  } = req.body as {
    destinationListId: string;
    orderedCardIds: string[];
    sourceListId?: string;
    sourceOrderedCardIds?: string[];
  };
  const workspaceId = req.workspaceId!;
  const boardId = req.boardId!;

  if (!destinationListId || !Array.isArray(orderedCardIds)) {
    return res
      .status(400)
      .json({ error: "destinationListId and orderedCardIds are required" });
  }

  const destList = await prisma.list.findUnique({
    where: { id: destinationListId },
    select: { board: { select: { workspaceId: true } } },
  });
  if (!destList)
    return res.status(404).json({ error: "Destination list not found" });
  if (destList.board.workspaceId !== workspaceId) {
    return res
      .status(403)
      .json({ error: "Cannot move card to a different workspace" });
  }

  const isCrossList = sourceListId && sourceListId !== destinationListId;

  const operations = [
    prisma.card.update({
      where: { id: cardId },
      data: { listId: destinationListId },
    }),
    ...orderedCardIds.map((id, index) =>
      prisma.card.update({ where: { id }, data: { position: index } }),
    ),
    ...(isCrossList && Array.isArray(sourceOrderedCardIds)
      ? sourceOrderedCardIds.map((id, index) =>
          prisma.card.update({ where: { id }, data: { position: index } }),
        )
      : []),
  ];

  await prisma.$transaction(operations);

  const destinationCards = await prisma.card.findMany({
    where: { listId: destinationListId },
    orderBy: { position: "asc" },
  });

  const sourceCards = isCrossList
    ? await prisma.card.findMany({
        where: { listId: sourceListId },
        orderBy: { position: "asc" },
      })
    : undefined;

  getIO()
    .to(`board:${boardId}`)
    .emit("card:reordered", {
      destinationListId,
      destinationCards,
      sourceListId: isCrossList ? sourceListId : undefined,
      sourceCards,
    });

  res.json({ success: true });
}

import { Response } from "express";
import prisma from "../config/prisma";
import { WorkspaceRequest } from "../middleware/workspace-access.middleware";

export async function createCard(req: WorkspaceRequest, res: Response) {
  const { listId } = req.params;
  const { title, description } = req.body;

  if (!title) return res.status(400).json({ error: "Card title is required" });

  const lastCard = await prisma.card.findFirst({
    where: { listId },
    orderBy: { position: "desc" },
  });
  const position = lastCard ? lastCard.position + 1 : 0;

  const card = await prisma.card.create({
    data: { title, description, listId, position },
  });

  res.status(201).json(card);
}

export async function updateCard(req: WorkspaceRequest, res: Response) {
  const { cardId } = req.params;
  const { title, description } = req.body;

  const card = await prisma.card.update({
    where: { id: cardId },
    data: { title, description },
  });

  res.json(card);
}

export async function reorderCard(req: WorkspaceRequest, res: Response) {
  const { cardId } = req.params;
  const { destinationListId, orderedCardIds } = req.body as {
    destinationListId: string;
    orderedCardIds: string[];
  };
  const workspaceId = req.workspaceId!;

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

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: { listId: destinationListId },
    }),
    ...orderedCardIds.map((id, index) =>
      prisma.card.update({ where: { id }, data: { position: index } }),
    ),
  ]);

  res.json({ success: true });
}

export async function deleteCard(req: WorkspaceRequest, res: Response) {
  const { cardId } = req.params;
  await prisma.card.delete({ where: { id: cardId } });
  res.status(204).send();
}

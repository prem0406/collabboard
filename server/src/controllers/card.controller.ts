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

export async function moveCard(req: WorkspaceRequest, res: Response) {
  const { cardId } = req.params;
  const { listId, position } = req.body; // destination list + position

  const card = await prisma.card.update({
    where: { id: cardId },
    data: { listId, position },
  });

  res.json(card);
}

export async function deleteCard(req: WorkspaceRequest, res: Response) {
  const { cardId } = req.params;
  await prisma.card.delete({ where: { id: cardId } });
  res.status(204).send();
}

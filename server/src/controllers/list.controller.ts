import { Response } from "express";
import prisma from "../config/prisma";
import { WorkspaceRequest } from "../middleware/workspace-access.middleware";
import { getIO } from "../socket";

export async function createList(req: WorkspaceRequest, res: Response) {
  const { boardId } = req.params;
  const { name } = req.body;

  const lastList = await prisma.list.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
  });
  const position = lastList ? lastList.position + 1 : 0;

  const list = await prisma.list.create({
    data: { name, boardId, position },
  });

  getIO()
    .to(`board:${boardId}`)
    .emit("list:created", { list: { ...list, cards: [] } });

  res.status(201).json(list);
}

export async function deleteList(req: WorkspaceRequest, res: Response) {
  const { listId } = req.params;
  const boardId = req.boardId!;

  await prisma.list.delete({ where: { id: listId } });

  getIO().to(`board:${boardId}`).emit("list:deleted", { listId });

  res.status(204).send();
}

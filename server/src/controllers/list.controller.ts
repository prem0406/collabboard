import { Response } from "express";
import prisma from "../config/prisma";
import { WorkspaceRequest } from "../middleware/workspace-access.middleware";

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

  res.status(201).json(list);
}

export async function deleteList(req: WorkspaceRequest, res: Response) {
  const { listId } = req.params;
  await prisma.list.delete({ where: { id: listId } });
  res.status(204).send();
}

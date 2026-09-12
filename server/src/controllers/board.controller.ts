import { Response } from "express";
import prisma from "../config/prisma";
import { WorkspaceRequest } from "../middleware/workspace-access.middleware";
import { asyncHandler } from "../middleware/error-handler.middleware";

export const createBoard = asyncHandler(
  async (req: WorkspaceRequest, res: Response) => {
    const { workspaceId } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: "Board name is required" });

    const board = await prisma.board.create({
      data: { name, workspaceId },
    });

    res.status(201).json(board);
  },
);

export const getBoards = asyncHandler(
  async (req: WorkspaceRequest, res: Response) => {
    const { workspaceId } = req.params;

    const boards = await prisma.board.findMany({ where: { workspaceId } });
    res.json(boards);
  },
);

export const getBoard = asyncHandler(
  async (req: WorkspaceRequest, res: Response) => {
    const { boardId } = req.params;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        lists: {
          orderBy: { position: "asc" },
          include: { cards: { orderBy: { position: "asc" } } },
        },
      },
    });

    if (!board) return res.status(404).json({ error: "Board not found" });
    res.json(board);
  },
);

export const deleteBoard = asyncHandler(
  async (req: WorkspaceRequest, res: Response) => {
    const { boardId } = req.params;
    await prisma.board.delete({ where: { id: boardId } });
    res.status(204).send();
  },
);

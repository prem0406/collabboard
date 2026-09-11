import { Response } from "express";
import prisma from "../config/prisma";
import { WorkspaceRequest } from "../middleware/workspace-access.middleware";
import { getIO } from "../socket";

export async function createComment(req: WorkspaceRequest, res: Response) {
  const { cardId } = req.params;
  const { content } = req.body;
  const userId = req.userId!;
  const boardId = req.boardId!;

  if (!content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ error: "Comment content is required" });
  }

  const comment = await prisma.comment.create({
    data: { content: content.trim(), cardId, authorId: userId },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  getIO().to(`board:${boardId}`).emit("comment:created", { cardId, comment });

  res.status(201).json(comment);
}

export async function getComments(req: WorkspaceRequest, res: Response) {
  const { cardId } = req.params;

  const comments = await prisma.comment.findMany({
    where: { cardId },
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  res.json(comments);
}

export async function deleteComment(req: WorkspaceRequest, res: Response) {
  const { commentId } = req.params;
  const userId = req.userId!;
  const boardId = req.boardId!;

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  // Only the author (or a workspace admin/owner) can delete a comment
  const canDelete =
    comment.authorId === userId ||
    ["OWNER", "ADMIN"].includes(req.workspaceRole!);
  if (!canDelete) {
    return res
      .status(403)
      .json({ error: "You can only delete your own comments" });
  }

  await prisma.comment.delete({ where: { id: commentId } });

  getIO()
    .to(`board:${boardId}`)
    .emit("comment:deleted", { cardId: comment.cardId, commentId });

  res.status(204).send();
}

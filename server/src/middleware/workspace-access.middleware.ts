import { Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "./auth.middleware";

export interface WorkspaceRequest extends AuthRequest {
  workspaceRole?: "OWNER" | "ADMIN" | "MEMBER";
  workspaceId?: string;
  boardId?: string;
}

async function checkMembership(userId: string, workspaceId: string) {
  return prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
}

// --- existing: for routes where :workspaceId IS in the URL ---
export async function requireWorkspaceMember(
  req: WorkspaceRequest,
  res: Response,
  next: NextFunction,
) {
  const workspaceId = req.params.workspaceId;
  const userId = req.userId!;

  const membership = await checkMembership(userId, workspaceId);
  if (!membership) {
    return res.status(403).json({ error: "Not a member of this workspace" });
  }

  req.workspaceRole = membership.role;
  req.workspaceId = workspaceId;
  next();
}

// --- NEW: for routes where :boardId IS in the URL ---
export async function requireBoardAccess(
  req: WorkspaceRequest,
  res: Response,
  next: NextFunction,
) {
  const { boardId } = req.params;
  const userId = req.userId!;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true },
  });

  if (!board) return res.status(404).json({ error: "Board not found" });

  const membership = await checkMembership(userId, board.workspaceId);
  if (!membership) {
    return res.status(403).json({ error: "Not a member of this workspace" });
  }

  req.workspaceRole = membership.role;
  req.workspaceId = board.workspaceId;
  req.boardId = boardId;
  next();
}

// --- NEW: for routes where :listId IS in the URL ---
export async function requireListAccess(
  req: WorkspaceRequest,
  res: Response,
  next: NextFunction,
) {
  const { listId } = req.params;
  const userId = req.userId!;

  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { board: { select: { id: true, workspaceId: true } } },
  });

  if (!list) return res.status(404).json({ error: "List not found" });

  const membership = await checkMembership(userId, list.board.workspaceId);
  if (!membership) {
    return res.status(403).json({ error: "Not a member of this workspace" });
  }

  req.workspaceRole = membership.role;
  req.workspaceId = list.board.workspaceId;
  req.boardId = list.board.id;
  next();
}

// --- NEW: for routes where :cardId IS in the URL ---
export async function requireCardAccess(
  req: WorkspaceRequest,
  res: Response,
  next: NextFunction,
) {
  const { cardId } = req.params;
  const userId = req.userId!;

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: {
      list: {
        select: {
          id: true,
          board: { select: { id: true, workspaceId: true } },
        },
      },
    },
  });

  if (!card) return res.status(404).json({ error: "Card not found" });

  const workspaceId = card.list.board.workspaceId;
  const membership = await checkMembership(userId, workspaceId);
  if (!membership) {
    return res.status(403).json({ error: "Not a member of this workspace" });
  }

  req.workspaceRole = membership.role;
  req.workspaceId = workspaceId;
  req.boardId = card.list.board.id;
  next();
}

export async function requireCommentAccess(
  req: WorkspaceRequest,
  res: Response,
  next: NextFunction,
) {
  const { commentId } = req.params;
  const userId = req.userId!;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      card: {
        select: {
          list: {
            select: { board: { select: { id: true, workspaceId: true } } },
          },
        },
      },
    },
  });

  if (!comment) return res.status(404).json({ error: "Comment not found" });

  const workspaceId = comment.card.list.board.workspaceId;
  const membership = await checkMembership(userId, workspaceId);
  if (!membership) {
    return res.status(403).json({ error: "Not a member of this workspace" });
  }

  req.workspaceRole = membership.role;
  req.workspaceId = workspaceId;
  req.boardId = comment.card.list.board.id;
  next();
}

export async function requireAttachmentAccess(
  req: WorkspaceRequest,
  res: Response,
  next: NextFunction,
) {
  const { attachmentId } = req.params;
  const userId = req.userId!;

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    select: {
      card: {
        select: {
          list: {
            select: { board: { select: { id: true, workspaceId: true } } },
          },
        },
      },
    },
  });

  if (!attachment)
    return res.status(404).json({ error: "Attachment not found" });

  const workspaceId = attachment.card.list.board.workspaceId;
  const membership = await checkMembership(userId, workspaceId);
  if (!membership) {
    return res.status(403).json({ error: "Not a member of this workspace" });
  }

  req.workspaceRole = membership.role;
  req.workspaceId = workspaceId;
  req.boardId = attachment.card.list.board.id;
  next();
}

export function requireRole(
  ...allowedRoles: Array<"OWNER" | "ADMIN" | "MEMBER">
) {
  return (req: WorkspaceRequest, res: Response, next: NextFunction) => {
    if (!req.workspaceRole || !allowedRoles.includes(req.workspaceRole)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

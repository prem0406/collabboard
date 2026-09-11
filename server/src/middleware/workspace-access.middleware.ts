import { Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "./auth.middleware";

export interface WorkspaceRequest extends AuthRequest {
  workspaceRole?: "OWNER" | "ADMIN" | "MEMBER";
  workspaceId?: string; // we'll populate this even when it's not in the URL
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
    select: { board: { select: { workspaceId: true } } },
  });

  if (!list) return res.status(404).json({ error: "List not found" });

  const membership = await checkMembership(userId, list.board.workspaceId);
  if (!membership) {
    return res.status(403).json({ error: "Not a member of this workspace" });
  }

  req.workspaceRole = membership.role;
  req.workspaceId = list.board.workspaceId;
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
    select: { list: { select: { board: { select: { workspaceId: true } } } } },
  });

  if (!card) return res.status(404).json({ error: "Card not found" });

  const workspaceId = card.list.board.workspaceId;
  const membership = await checkMembership(userId, workspaceId);
  if (!membership) {
    return res.status(403).json({ error: "Not a member of this workspace" });
  }

  req.workspaceRole = membership.role;
  req.workspaceId = workspaceId;
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

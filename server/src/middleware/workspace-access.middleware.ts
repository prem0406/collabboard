import { Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "./auth.middleware";

export interface WorkspaceRequest extends AuthRequest {
  workspaceRole?: "OWNER" | "ADMIN" | "MEMBER";
}

export async function requireWorkspaceMember(
  req: WorkspaceRequest,
  res: Response,
  next: NextFunction,
) {
  const workspaceId = req.params.workspaceId;
  const userId = req.userId!;

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    return res.status(403).json({ error: "Not a member of this workspace" });
  }

  req.workspaceRole = membership.role;
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

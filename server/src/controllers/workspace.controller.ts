import { Response } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { WorkspaceRequest } from "../middleware/workspace-access.middleware";

export async function createWorkspace(req: AuthRequest, res: Response) {
  const { name } = req.body;
  const userId = req.userId!;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Workspace name is required" });
  }

  const workspace = await prisma.workspace.create({
    data: {
      name,
      members: {
        create: { userId, role: "OWNER" },
      },
    },
  });

  res.status(201).json(workspace);
}

export async function getMyWorkspaces(req: AuthRequest, res: Response) {
  const userId = req.userId!;

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: { workspace: true },
  });

  const workspaces = memberships.map((m) => ({
    ...m.workspace,
    myRole: m.role,
  }));

  res.json(workspaces);
}

export async function getWorkspace(req: WorkspaceRequest, res: Response) {
  const { workspaceId } = req.params;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      boards: true,
    },
  });

  if (!workspace) return res.status(404).json({ error: "Workspace not found" });

  res.json(workspace);
}

export async function inviteMember(req: WorkspaceRequest, res: Response) {
  const { workspaceId } = req.params;
  const { email, role } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return res.status(404).json({ error: "No user found with that email" });

  const existing = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });
  if (existing)
    return res.status(409).json({ error: "User is already a member" });

  const member = await prisma.workspaceMember.create({
    data: { userId: user.id, workspaceId, role: role || "MEMBER" },
  });

  res.status(201).json(member);
}

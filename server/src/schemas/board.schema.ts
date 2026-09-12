import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const createBoardSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const createListSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const createCardSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).optional(),
});

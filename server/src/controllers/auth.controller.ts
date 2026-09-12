import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { registerSchema, loginSchema } from "../schemas/auth.schema";
import { asyncHandler } from "../middleware/error-handler.middleware";
import { AuthRequest } from "../middleware/auth.middleware";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days, matches JWT_EXPIRES_IN

function setAuthCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction, // only over HTTPS in production
    sameSite: isProduction ? "none" : "lax", // 'none' needed for cross-site cookies in prod (different domains)
    maxAge: COOKIE_MAX_AGE,
  });
}

function signToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { name, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  const token = signToken(user.id);
  setAuthCookie(res, token);

  return res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken(user.id);
  setAuthCookie(res, token);

  return res.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("token");
  res.status(204).send();
});

// NEW — lets the frontend rehydrate "who am I" on page load,
// since JS can no longer read the token to decode it itself
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

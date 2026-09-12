import { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client";
import logger from "../config/logger";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Resource not found" });
    }
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ error: "A record with this value already exists" });
    }
  }

  logger.error(err);
  res.status(500).json({ error: "Something went wrong" });
}

// Wraps async route handlers so thrown/rejected errors reach errorHandler
// instead of crashing past Express's default handling
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

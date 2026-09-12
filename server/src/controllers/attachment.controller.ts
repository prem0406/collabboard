import { Response } from "express";
import prisma from "../config/prisma";
import { WorkspaceRequest } from "../middleware/workspace-access.middleware";
import { getIO } from "../socket";
import fs from "fs";
import path from "path";
import { asyncHandler } from "../middleware/error-handler.middleware";

export const uploadAttachment = asyncHandler(
  async (req: WorkspaceRequest, res: Response) => {
    const { cardId } = req.params;
    const userId = req.userId!;
    const boardId = req.boardId!;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const attachment = await prisma.attachment.create({
      data: {
        filename: file.originalname,
        url: `/uploads/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        cardId,
        uploadedById: userId,
      },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });

    getIO()
      .to(`board:${boardId}`)
      .emit("attachment:created", { cardId, attachment });

    res.status(201).json(attachment);
  },
);

export const getAttachments = asyncHandler(
  async (req: WorkspaceRequest, res: Response) => {
    const { cardId } = req.params;

    const attachments = await prisma.attachment.findMany({
      where: { cardId },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json(attachments);
  },
);

export const deleteAttachment = asyncHandler(
  async (req: WorkspaceRequest, res: Response) => {
    const { attachmentId } = req.params;
    const boardId = req.boardId!;

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });
    if (!attachment)
      return res.status(404).json({ error: "Attachment not found" });

    // Delete the file from disk, then the DB record
    const filePath = path.join(
      __dirname,
      "../../uploads",
      path.basename(attachment.url),
    );
    fs.unlink(filePath, (err) => {
      if (err) console.error("Failed to delete file from disk:", err); // log, don't block the response
    });

    await prisma.attachment.delete({ where: { id: attachmentId } });

    getIO()
      .to(`board:${boardId}`)
      .emit("attachment:deleted", { cardId: attachment.cardId, attachmentId });

    res.status(204).send();
  },
);

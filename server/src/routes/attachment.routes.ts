import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  requireAttachmentAccess,
  requireCardAccess,
} from "../middleware/workspace-access.middleware";
import { upload } from "../config/upload";
import * as attachmentController from "../controllers/attachment.controller";

const router = Router();
router.use(requireAuth);

router.get(
  "/:cardId/attachments",
  requireCardAccess,
  attachmentController.getAttachments,
);
router.post(
  "/:cardId/attachments",
  requireCardAccess,
  upload.single("file"),
  attachmentController.uploadAttachment,
);

router.delete(
  "/attachments/:attachmentId",
  requireAttachmentAccess,
  attachmentController.deleteAttachment,
);

export default router;

import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  requireCardAccess,
  requireCommentAccess,
} from "../middleware/workspace-access.middleware";
import * as commentController from "../controllers/comment.controller";

const router = Router();
router.use(requireAuth);

router.get(
  "/:cardId/comments",
  requireCardAccess,
  commentController.getComments,
);
router.post(
  "/:cardId/comments",
  requireCardAccess,
  commentController.createComment,
);

router.delete(
  "/comments/:commentId",
  requireCommentAccess,
  commentController.deleteComment,
);

export default router;

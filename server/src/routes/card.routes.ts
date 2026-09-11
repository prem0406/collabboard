import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireCardAccess } from "../middleware/workspace-access.middleware";
import * as cardController from "../controllers/card.controller";

const router = Router();

router.use(requireAuth);

router.patch("/:cardId", requireCardAccess, cardController.updateCard);
router.patch("/:cardId/move", requireCardAccess, cardController.moveCard);
router.delete("/:cardId", requireCardAccess, cardController.deleteCard);

export default router;

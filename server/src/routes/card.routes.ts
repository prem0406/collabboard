import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as cardController from "../controllers/card.controller";

const router = Router();

router.use(requireAuth);

router.patch("/:cardId", cardController.updateCard);
router.patch("/:cardId/move", cardController.moveCard);
router.delete("/:cardId", cardController.deleteCard);

export default router;

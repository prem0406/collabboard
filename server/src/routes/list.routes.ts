import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as listController from "../controllers/list.controller";
import * as cardController from "../controllers/card.controller";

const router = Router();

router.use(requireAuth);

router.delete("/:listId", listController.deleteList);
router.post("/:listId/cards", cardController.createCard);

export default router;

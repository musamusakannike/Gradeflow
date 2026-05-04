import { Router } from "express";
import { classController } from "../controllers/class.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { classValidation } from "../validations/academic-structure.validation";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

router
  .route("/")
  .get(classController.getClasses)
  .post(
    authorize(UserRole.SCHOOL_ADMIN),
    validateRequest(classValidation.createClass),
    classController.createClass
  );

router
  .route("/:id")
  .get(classController.getClassById)
  .patch(
    authorize(UserRole.SCHOOL_ADMIN),
    validateRequest(classValidation.updateClass),
    classController.updateClass
  )
  .delete(
    authorize(UserRole.SCHOOL_ADMIN),
    classController.deleteClass
  );

export default router;

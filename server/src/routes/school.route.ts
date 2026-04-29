import { Router } from "express";
import { schoolController } from "../controllers/school.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { schoolValidation } from "../validations/school.validation";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

router
  .route("/me")
  .get(authorize(UserRole.SCHOOL_ADMIN), schoolController.getProfile)
  .patch(
    authorize(UserRole.SCHOOL_ADMIN),
    validateRequest(schoolValidation.updateProfile),
    schoolController.updateProfile,
  );

export default router;

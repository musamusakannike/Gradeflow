import { Router } from "express";
import { staffController } from "../controllers/staff.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { staffValidation } from "../validations/staff.validation";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

router
  .route("/")
  .get(staffController.getStaff)
  .post(
    authorize(UserRole.SCHOOL_ADMIN),
    validateRequest(staffValidation.createStaff),
    staffController.createStaff
  );

router
  .route("/:id")
  .get(staffController.getStaffById)
  .patch(
    authorize(UserRole.SCHOOL_ADMIN),
    validateRequest(staffValidation.updateStaff),
    staffController.updateStaff
  )
  .delete(
    authorize(UserRole.SCHOOL_ADMIN),
    staffController.deleteStaff
  );

export default router;

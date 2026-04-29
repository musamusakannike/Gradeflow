import { Router } from "express";
import { studentController } from "../controllers/student.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { studentValidation } from "../validations/student.validation";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

// --- Student Statistics ---
router.get("/stats", studentController.getStats);

// --- Student CRUD ---
router
  .route("/")
  .get(studentController.getStudents)
  .post(
    authorize(UserRole.SCHOOL_ADMIN),
    validateRequest(studentValidation.createStudent),
    studentController.createStudent
  );

router.post(
  "/bulk",
  authorize(UserRole.SCHOOL_ADMIN),
  validateRequest(studentValidation.bulkCreate),
  studentController.bulkCreateStudents
);

router
  .route("/:id")
  .get(studentController.getStudentById)
  .patch(
    authorize(UserRole.SCHOOL_ADMIN),
    validateRequest(studentValidation.updateStudent),
    studentController.updateStudent
  )
  .delete(
    authorize(UserRole.SCHOOL_ADMIN),
    studentController.deleteStudent
  );

// --- Student Actions ---
router.post(
  "/:id/transfer",
  authorize(UserRole.SCHOOL_ADMIN),
  studentController.transferStudent
);

router.patch(
  "/:id/status",
  authorize(UserRole.SCHOOL_ADMIN),
  studentController.updateStatus
);

export default router;

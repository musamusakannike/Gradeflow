import { Router } from "express";
import { subjectController } from "../controllers/subject.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { 
  subjectValidation, 
  classSubjectValidation 
} from "../validations/academic-structure.validation";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

// --- Subject CRUD ---

router
  .route("/")
  .get(subjectController.getSubjects)
  .post(
    authorize(UserRole.SCHOOL_ADMIN),
    validateRequest(subjectValidation.createSubject),
    subjectController.createSubject
  );

router
  .route("/:id")
  .get(subjectController.getSubjectById)
  .patch(
    authorize(UserRole.SCHOOL_ADMIN),
    validateRequest(subjectValidation.updateSubject),
    subjectController.updateSubject
  );

// --- Assignments ---

router.post(
  "/assign",
  authorize(UserRole.SCHOOL_ADMIN),
  validateRequest(classSubjectValidation.assignSubject),
  subjectController.assignToClass
);

// GET all assignments for the school (must be before /:classId to avoid conflict)
router.get(
  "/assignments",
  authorize(UserRole.SCHOOL_ADMIN),
  subjectController.getAllAssignments
);

// DELETE a specific assignment by id
router.delete(
  "/assignments/:id",
  authorize(UserRole.SCHOOL_ADMIN),
  subjectController.deleteAssignment
);

router.get(
  "/assignments/:classId",
  subjectController.getClassAssignments
);

router.patch(
  "/assignments/:id",
  authorize(UserRole.SCHOOL_ADMIN),
  validateRequest(classSubjectValidation.updateAssignment),
  subjectController.updateAssignment
);

export default router;

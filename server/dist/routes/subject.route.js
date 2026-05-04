"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subject_controller_1 = require("../controllers/subject.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const academic_structure_validation_1 = require("../validations/academic-structure.validation");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// --- Subject CRUD ---
router
    .route("/")
    .get(subject_controller_1.subjectController.getSubjects)
    .post((0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(academic_structure_validation_1.subjectValidation.createSubject), subject_controller_1.subjectController.createSubject);
router
    .route("/:id")
    .get(subject_controller_1.subjectController.getSubjectById)
    .patch((0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(academic_structure_validation_1.subjectValidation.updateSubject), subject_controller_1.subjectController.updateSubject);
// --- Assignments ---
router.post("/assign", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(academic_structure_validation_1.classSubjectValidation.assignSubject), subject_controller_1.subjectController.assignToClass);
router.get("/assignments/:classId", subject_controller_1.subjectController.getClassAssignments);
router.patch("/assignments/:id", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(academic_structure_validation_1.classSubjectValidation.updateAssignment), subject_controller_1.subjectController.updateAssignment);
exports.default = router;
//# sourceMappingURL=subject.route.js.map
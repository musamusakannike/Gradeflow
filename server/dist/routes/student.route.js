"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_controller_1 = require("../controllers/student.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const student_validation_1 = require("../validations/student.validation");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// --- Student Statistics ---
router.get("/stats", student_controller_1.studentController.getStats);
router.get("/my-children", (0, auth_middleware_1.authorize)(types_1.UserRole.PARENT), student_controller_1.studentController.getMyChildren);
// --- Student CRUD ---
router
    .route("/")
    .get(student_controller_1.studentController.getStudents)
    .post((0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(student_validation_1.studentValidation.createStudent), student_controller_1.studentController.createStudent);
router.post("/bulk", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(student_validation_1.studentValidation.bulkCreate), student_controller_1.studentController.bulkCreateStudents);
router
    .route("/:id")
    .get(student_controller_1.studentController.getStudentById)
    .patch((0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(student_validation_1.studentValidation.updateStudent), student_controller_1.studentController.updateStudent)
    .delete((0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), student_controller_1.studentController.deleteStudent);
// --- Student Actions ---
router.post("/:id/transfer", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), student_controller_1.studentController.transferStudent);
router.patch("/:id/status", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), student_controller_1.studentController.updateStatus);
router.post("/:id/parent-account", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(student_validation_1.studentValidation.createParentAccount), student_controller_1.studentController.createParentAccount);
exports.default = router;
//# sourceMappingURL=student.route.js.map
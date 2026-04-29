"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const result_controller_1 = require("../controllers/result.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const result_validation_1 = require("../validations/result.validation");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// --- Result Lifecycle ---
router.post("/compile", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(result_validation_1.resultValidation.classTermBody), result_controller_1.resultController.compileResult);
router.post("/release", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(result_validation_1.resultValidation.classTermBody), result_controller_1.resultController.releaseResult);
router.post("/unrelease", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(result_validation_1.resultValidation.classTermBody), result_controller_1.resultController.unreleaseResult);
router.get("/status", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.TEACHER), (0, validation_middleware_1.validateRequest)(result_validation_1.resultValidation.status), result_controller_1.resultController.getResultStatus);
// --- Student Report Card ---
router.get("/student/:studentId", result_controller_1.resultController.getStudentResult);
// --- Class Broadsheet ---
router.get("/class/:classId", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.TEACHER), result_controller_1.resultController.getClassResults);
exports.default = router;
//# sourceMappingURL=result.route.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const result_controller_1 = require("../controllers/result.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// --- Student Report Card ---
router.get("/student/:studentId", result_controller_1.resultController.getStudentResult);
// --- Class Broadsheet ---
router.get("/class/:classId", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.TEACHER), result_controller_1.resultController.getClassResults);
exports.default = router;
//# sourceMappingURL=result.route.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const academic_controller_1 = require("../controllers/academic.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const academic_validation_1 = require("../validations/academic.validation");
const types_1 = require("../types");
const router = (0, express_1.Router)();
// All academic routes require authentication
router.use(auth_middleware_1.authenticate);
// --- Session Routes ---
router
    .route("/sessions")
    .get(academic_controller_1.academicController.getSessions)
    .post((0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(academic_validation_1.createSessionSchema), academic_controller_1.academicController.createSession);
router.patch("/sessions/:id/current", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), academic_controller_1.academicController.setCurrentSession);
// --- Term Routes ---
router
    .route("/terms")
    .get(academic_controller_1.academicController.getTerms);
router
    .route("/terms/:id")
    .patch((0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(academic_validation_1.updateTermSchema), academic_controller_1.academicController.updateTerm);
router.patch("/terms/:id/current", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), academic_controller_1.academicController.setCurrentTerm);
exports.default = router;
//# sourceMappingURL=academic.route.js.map
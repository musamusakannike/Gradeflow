"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const score_controller_1 = require("../controllers/score.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const score_validation_1 = require("../validations/score.validation");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// --- Score Management ---
router.post("/", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.TEACHER), (0, validation_middleware_1.validateRequest)(score_validation_1.scoreValidation.enterScore), score_controller_1.scoreController.enterScore);
router.post("/bulk", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.TEACHER), (0, validation_middleware_1.validateRequest)(score_validation_1.scoreValidation.bulkEnterScores), score_controller_1.scoreController.bulkEnterScores);
// --- Subject Performance ---
router.get("/subject/:classSubjectId", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.TEACHER), score_controller_1.scoreController.getSubjectScores);
exports.default = router;
//# sourceMappingURL=score.route.js.map
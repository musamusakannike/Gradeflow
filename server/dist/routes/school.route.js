"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const school_controller_1 = require("../controllers/school.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const school_validation_1 = require("../validations/school.validation");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router
    .route("/me")
    .get((0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), school_controller_1.schoolController.getProfile)
    .patch((0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(school_validation_1.schoolValidation.updateProfile), school_controller_1.schoolController.updateProfile);
exports.default = router;
//# sourceMappingURL=school.route.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const staff_controller_1 = require("../controllers/staff.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const staff_validation_1 = require("../validations/staff.validation");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router
    .route("/")
    .get(staff_controller_1.staffController.getStaff)
    .post((0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(staff_validation_1.staffValidation.createStaff), staff_controller_1.staffController.createStaff);
router
    .route("/:id")
    .get(staff_controller_1.staffController.getStaffById)
    .patch((0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(staff_validation_1.staffValidation.updateStaff), staff_controller_1.staffController.updateStaff)
    .delete((0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), staff_controller_1.staffController.deleteStaff);
exports.default = router;
//# sourceMappingURL=staff.route.js.map
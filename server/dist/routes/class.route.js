"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const class_controller_1 = require("../controllers/class.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const academic_structure_validation_1 = require("../validations/academic-structure.validation");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router
    .route("/")
    .get(class_controller_1.classController.getClasses)
    .post((0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(academic_structure_validation_1.classValidation.createClass), class_controller_1.classController.createClass);
router
    .route("/:id")
    .get(class_controller_1.classController.getClassById)
    .patch((0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), (0, validation_middleware_1.validateRequest)(academic_structure_validation_1.classValidation.updateClass), class_controller_1.classController.updateClass)
    .delete((0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN), class_controller_1.classController.deleteClass);
exports.default = router;
//# sourceMappingURL=class.route.js.map
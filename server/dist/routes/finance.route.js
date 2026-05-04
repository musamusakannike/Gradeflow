"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const finance_controller_1 = require("../controllers/finance.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const finance_validation_1 = require("../validations/finance.validation");
const types_1 = require("../types");
const router = (0, express_1.Router)();
// Webhook is public but verified with signature inside controller
router.post("/webhook", finance_controller_1.financeController.handleWebhook);
router.use(auth_middleware_1.authenticate);
// --- Payment Actions ---
router.post("/payments/initialize", (0, validation_middleware_1.validateRequest)(finance_validation_1.financeValidation.initializePayment), finance_controller_1.financeController.initializePayment);
router.get("/payments/verify", (0, validation_middleware_1.validateRequest)(finance_validation_1.financeValidation.verifyPayment), finance_controller_1.financeController.verifyPayment);
router.get("/payments/student/:studentId", finance_controller_1.financeController.getStudentPayments);
// --- Fee Status Management ---
router.get("/fee-status/:studentId", finance_controller_1.financeController.getStudentFeeStatus);
router.post("/fee-status", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.BURSAR), (0, validation_middleware_1.validateRequest)(finance_validation_1.financeValidation.setFeeStatus), finance_controller_1.financeController.setFeeStatus);
// --- Statistics ---
router.get("/stats/:termId", (0, auth_middleware_1.authorize)(types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.BURSAR), finance_controller_1.financeController.getTermStats);
exports.default = router;
//# sourceMappingURL=finance.route.js.map
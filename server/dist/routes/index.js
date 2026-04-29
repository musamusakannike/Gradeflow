"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = __importDefault(require("./auth.route"));
const academic_route_1 = __importDefault(require("./academic.route"));
const class_route_1 = __importDefault(require("./class.route"));
const subject_route_1 = __importDefault(require("./subject.route"));
const router = (0, express_1.Router)();
/**
 * API v1 routes
 */
router.use("/auth", auth_route_1.default);
router.use("/academic", academic_route_1.default);
router.use("/classes", class_route_1.default);
router.use("/subjects", subject_route_1.default);
// router.use("/schools", schoolRoutes);
// router.use("/users", userRoutes);
// router.use("/students", studentRoutes);
// router.use("/sessions", sessionRoutes);
// router.use("/terms", termRoutes);
// router.use("/classes", classRoutes);
// router.use("/subjects", subjectRoutes);
// router.use("/scores", scoreRoutes);
// router.use("/results", resultRoutes);
// router.use("/payments", paymentRoutes);
exports.default = router;
//# sourceMappingURL=index.js.map
import { Router } from "express";
import authRoutes from "./auth.route";
import academicRoutes from "./academic.route";
import classRoutes from "./class.route";
import subjectRoutes from "./subject.route";
import staffRoutes from "./staff.route";
import studentRoutes from "./student.route";
import scoreRoutes from "./score.route";
import resultRoutes from "./result.route";

const router = Router();

/**
 * API v1 routes
 */
router.use("/auth", authRoutes);
router.use("/academic", academicRoutes);
router.use("/classes", classRoutes);
router.use("/subjects", subjectRoutes);
router.use("/staff", staffRoutes);
router.use("/students", studentRoutes);
router.use("/scores", scoreRoutes);
router.use("/results", resultRoutes);

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

export default router;

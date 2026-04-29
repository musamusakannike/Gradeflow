import { Router } from "express";
import authRoutes from "./auth.route";

const router = Router();

/**
 * API v1 routes
 */
router.use("/auth", authRoutes);

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

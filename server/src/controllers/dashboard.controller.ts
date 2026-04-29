import { Response, NextFunction } from "express";
import { getDashboardSummary } from "../services/dashboard.service";
import { sendSuccess } from "../utils/response.util";
import { AuthenticatedRequest } from "../types";

class DashboardController {
  async getSummary(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const summary = await getDashboardSummary(req.user!);
      sendSuccess(res, summary, "Dashboard summary retrieved successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();

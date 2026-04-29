"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
const response_util_1 = require("../utils/response.util");
class DashboardController {
    async getSummary(req, res, next) {
        try {
            const summary = await (0, dashboard_service_1.getDashboardSummary)(req.user);
            (0, response_util_1.sendSuccess)(res, summary, "Dashboard summary retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.dashboardController = new DashboardController();
//# sourceMappingURL=dashboard.controller.js.map
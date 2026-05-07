"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = void 0;
const models_1 = require("../models");
const logger_util_1 = require("../utils/logger.util");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const bootstrap = async () => {
    try {
        if (process.env.SEED_DUMMY_DATA === "true") {
            const schoolCount = await models_1.School.countDocuments();
            if (schoolCount === 0) {
                logger_util_1.logger.info("No school found in database. Seeding dummy data...");
                // Run the seed script as a separate process to avoid database connection conflicts 
                // and to keep server.ts clean
                const seedPath = path_1.default.join(__dirname, "seed.ts");
                const tsNodeDevPath = path_1.default.join(process.cwd(), "node_modules", ".bin", "ts-node-dev");
                (0, child_process_1.exec)(`${tsNodeDevPath} --transpile-only ${seedPath}`, (error, stdout, stderr) => {
                    if (error) {
                        logger_util_1.logger.error(`Seeding error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        logger_util_1.logger.error(`Seeding stderr: ${stderr}`);
                    }
                    logger_util_1.logger.info(`Seeding output: ${stdout}`);
                    logger_util_1.logger.info("Dummy data seeded successfully.");
                });
            }
            else {
                logger_util_1.logger.info("Database already contains data. Skipping seed.");
            }
        }
    }
    catch (error) {
        logger_util_1.logger.error("Bootstrap error:", error);
    }
};
exports.bootstrap = bootstrap;
//# sourceMappingURL=bootstrap.js.map
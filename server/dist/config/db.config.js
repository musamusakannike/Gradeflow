"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_util_1 = require("../utils/logger.util");
const connectDatabase = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }
        mongoose_1.default.set("strictQuery", true);
        const conn = await mongoose_1.default.connect(mongoUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4, // Force IPv4 to avoid potential IPv6 resolution issues
        });
        logger_util_1.logger.info(`MongoDB Connected: ${conn.connection.host}`);
        mongoose_1.default.connection.on("error", (err) => {
            logger_util_1.logger.error("MongoDB connection error:", err);
        });
        mongoose_1.default.connection.on("disconnected", () => {
            logger_util_1.logger.warn("MongoDB disconnected. Attempting to reconnect...");
        });
        mongoose_1.default.connection.on("reconnected", () => {
            logger_util_1.logger.info("MongoDB reconnected");
        });
        // Graceful shutdown
        process.on("SIGINT", async () => {
            await mongoose_1.default.connection.close();
            logger_util_1.logger.info("MongoDB connection closed due to app termination");
            process.exit(0);
        });
    }
    catch (error) {
        logger_util_1.logger.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
const disconnectDatabase = async () => {
    try {
        await mongoose_1.default.connection.close();
        logger_util_1.logger.info("MongoDB connection closed");
    }
    catch (error) {
        logger_util_1.logger.error("Error disconnecting from MongoDB:", error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
//# sourceMappingURL=db.config.js.map
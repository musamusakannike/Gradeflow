"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadStudentDocument = exports.uploadUserAvatar = exports.uploadSchoolLogo = exports.generateSchoolPath = exports.getFileMetadata = exports.fileExists = exports.deleteFile = exports.getSignedUploadUrl = exports.getSignedDownloadUrl = exports.uploadBuffer = exports.uploadFiles = exports.uploadFile = void 0;
require("multer");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const r2_config_js_1 = require("../config/r2.config.js");
const helpers_util_js_1 = require("../utils/helpers.util.js");
const logger_util_js_1 = require("../utils/logger.util.js");
const errors_util_js_1 = require("../utils/errors.util.js");
/**
 * Upload a file to R2 storage
 */
const uploadFile = async (file, options = {}) => {
    const filename = options.filename || (0, helpers_util_js_1.generateUniqueFilename)(file.originalname);
    const sanitizedFilename = (0, helpers_util_js_1.sanitizeFilename)(filename);
    const folder = options.folder ? `${options.folder}/` : "";
    const key = `${folder}${sanitizedFilename}`;
    const contentType = options.contentType || file.mimetype;
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: r2_config_js_1.r2Config.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: contentType,
            ContentLength: file.size,
        });
        await r2_config_js_1.r2Client.send(command);
        const url = options.public
            ? `${r2_config_js_1.r2Config.publicUrl}/${key}`
            : await (0, exports.getSignedDownloadUrl)(key);
        logger_util_js_1.logger.info("File uploaded successfully:", { key, size: file.size });
        return {
            key,
            url,
            size: file.size,
            contentType,
        };
    }
    catch (error) {
        logger_util_js_1.logger.error("Error uploading file:", error);
        throw new errors_util_js_1.BadRequestError("Failed to upload file");
    }
};
exports.uploadFile = uploadFile;
/**
 * Upload multiple files
 */
const uploadFiles = async (files, options = {}) => {
    return Promise.all(files.map((file) => (0, exports.uploadFile)(file, options)));
};
exports.uploadFiles = uploadFiles;
/**
 * Upload a buffer directly
 */
const uploadBuffer = async (buffer, filename, contentType, options = {}) => {
    const sanitizedFilename = (0, helpers_util_js_1.sanitizeFilename)(filename);
    const folder = options.folder ? `${options.folder}/` : "";
    const key = `${folder}${sanitizedFilename}`;
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: r2_config_js_1.r2Config.bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ContentLength: buffer.length,
        });
        await r2_config_js_1.r2Client.send(command);
        const url = options.public
            ? `${r2_config_js_1.r2Config.publicUrl}/${key}`
            : await (0, exports.getSignedDownloadUrl)(key);
        logger_util_js_1.logger.info("Buffer uploaded successfully:", { key, size: buffer.length });
        return {
            key,
            url,
            size: buffer.length,
            contentType,
        };
    }
    catch (error) {
        logger_util_js_1.logger.error("Error uploading buffer:", error);
        throw new errors_util_js_1.BadRequestError("Failed to upload file");
    }
};
exports.uploadBuffer = uploadBuffer;
/**
 * Get a signed download URL
 */
const getSignedDownloadUrl = async (key, expiresIn = 3600) => {
    const command = new client_s3_1.GetObjectCommand({
        Bucket: r2_config_js_1.r2Config.bucketName,
        Key: key,
    });
    return (0, s3_request_presigner_1.getSignedUrl)(r2_config_js_1.r2Client, command, { expiresIn });
};
exports.getSignedDownloadUrl = getSignedDownloadUrl;
/**
 * Get a signed upload URL
 */
const getSignedUploadUrl = async (key, contentType, expiresIn = 3600) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket: r2_config_js_1.r2Config.bucketName,
        Key: key,
        ContentType: contentType,
    });
    return (0, s3_request_presigner_1.getSignedUrl)(r2_config_js_1.r2Client, command, { expiresIn });
};
exports.getSignedUploadUrl = getSignedUploadUrl;
/**
 * Delete a file from storage
 */
const deleteFile = async (key) => {
    try {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: r2_config_js_1.r2Config.bucketName,
            Key: key,
        });
        await r2_config_js_1.r2Client.send(command);
        logger_util_js_1.logger.info("File deleted successfully:", { key });
        return true;
    }
    catch (error) {
        logger_util_js_1.logger.error("Error deleting file:", error);
        return false;
    }
};
exports.deleteFile = deleteFile;
/**
 * Check if a file exists
 */
const fileExists = async (key) => {
    try {
        const command = new client_s3_1.HeadObjectCommand({
            Bucket: r2_config_js_1.r2Config.bucketName,
            Key: key,
        });
        await r2_config_js_1.r2Client.send(command);
        return true;
    }
    catch {
        return false;
    }
};
exports.fileExists = fileExists;
/**
 * Get file metadata
 */
const getFileMetadata = async (key) => {
    try {
        const command = new client_s3_1.HeadObjectCommand({
            Bucket: r2_config_js_1.r2Config.bucketName,
            Key: key,
        });
        const response = await r2_config_js_1.r2Client.send(command);
        return {
            contentType: response.ContentType || "application/octet-stream",
            size: response.ContentLength || 0,
            lastModified: response.LastModified || new Date(),
        };
    }
    catch {
        return null;
    }
};
exports.getFileMetadata = getFileMetadata;
/**
 * Generate a unique path for school uploads
 */
const generateSchoolPath = (schoolId, folder, filename) => {
    const uniqueFilename = (0, helpers_util_js_1.generateUniqueFilename)(filename);
    return `schools/${schoolId}/${folder}/${uniqueFilename}`;
};
exports.generateSchoolPath = generateSchoolPath;
/**
 * Upload school logo
 */
const uploadSchoolLogo = async (schoolId, file) => {
    return (0, exports.uploadFile)(file, {
        folder: `schools/${schoolId}/logo`,
        public: true,
    });
};
exports.uploadSchoolLogo = uploadSchoolLogo;
/**
 * Upload user avatar
 */
const uploadUserAvatar = async (userId, file) => {
    return (0, exports.uploadFile)(file, {
        folder: `users/${userId}/avatar`,
        public: true,
    });
};
exports.uploadUserAvatar = uploadUserAvatar;
/**
 * Upload student document
 */
const uploadStudentDocument = async (schoolId, studentId, file) => {
    return (0, exports.uploadFile)(file, {
        folder: `schools/${schoolId}/students/${studentId}/documents`,
        public: false,
    });
};
exports.uploadStudentDocument = uploadStudentDocument;
//# sourceMappingURL=storage.service.js.map
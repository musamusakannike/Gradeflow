"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multipleDocuments = exports.multipleImages = exports.singleDocument = exports.singleAvatar = exports.singleLogo = exports.singleImage = exports.uploadAny = exports.uploadDocuments = exports.uploadDocument = exports.uploadImages = exports.uploadImage = void 0;
const multer_1 = __importDefault(require("multer"));
const errors_util_1 = require("../utils/errors.util");
// Define allowed file types
const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
];
const ALLOWED_DOCUMENT_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
// File size limits (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
// Memory storage for processing before upload to R2
const storage = multer_1.default.memoryStorage();
// Image file filter
const imageFilter = (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errors_util_1.BadRequestError(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`));
    }
};
// Document file filter
const documentFilter = (req, file, cb) => {
    if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errors_util_1.BadRequestError(`Invalid file type. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(", ")}`));
    }
};
// Combined file filter
const anyFileFilter = (req, file, cb) => {
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errors_util_1.BadRequestError(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`));
    }
};
// Upload configurations
exports.uploadImage = (0, multer_1.default)({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: MAX_IMAGE_SIZE,
        files: 1,
    },
});
exports.uploadImages = (0, multer_1.default)({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: MAX_IMAGE_SIZE,
        files: 10,
    },
});
exports.uploadDocument = (0, multer_1.default)({
    storage,
    fileFilter: documentFilter,
    limits: {
        fileSize: MAX_DOCUMENT_SIZE,
        files: 1,
    },
});
exports.uploadDocuments = (0, multer_1.default)({
    storage,
    fileFilter: documentFilter,
    limits: {
        fileSize: MAX_DOCUMENT_SIZE,
        files: 5,
    },
});
exports.uploadAny = (0, multer_1.default)({
    storage,
    fileFilter: anyFileFilter,
    limits: {
        fileSize: MAX_DOCUMENT_SIZE,
        files: 5,
    },
});
// Single file upload shortcuts
exports.singleImage = exports.uploadImage.single("image");
exports.singleLogo = exports.uploadImage.single("logo");
exports.singleAvatar = exports.uploadImage.single("avatar");
exports.singleDocument = exports.uploadDocument.single("document");
// Multiple file upload shortcuts
exports.multipleImages = exports.uploadImages.array("images", 10);
exports.multipleDocuments = exports.uploadDocuments.array("documents", 5);
//# sourceMappingURL=upload.middleware.js.map
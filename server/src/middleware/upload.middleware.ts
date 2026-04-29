import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { BadRequestError } from "../utils/errors.util";

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
const storage = multer.memoryStorage();

// Image file filter
const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
      ),
    );
  }
};

// Document file filter
const documentFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Invalid file type. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(", ")}`,
      ),
    );
  }
};

// Combined file filter
const anyFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
      ),
    );
  }
};

// Upload configurations
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
});

export const uploadImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 10,
  },
});

export const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 1,
  },
});

export const uploadDocuments = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 5,
  },
});

export const uploadAny = multer({
  storage,
  fileFilter: anyFileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 5,
  },
});

// Single file upload shortcuts
export const singleImage = uploadImage.single("image");
export const singleLogo = uploadImage.single("logo");
export const singleAvatar = uploadImage.single("avatar");
export const singleDocument = uploadDocument.single("document");

// Multiple file upload shortcuts
export const multipleImages = uploadImages.array("images", 10);
export const multipleDocuments = uploadDocuments.array("documents", 5);

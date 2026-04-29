import "multer";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, r2Config } from "../config/r2.config.js";
import {
  generateUniqueFilename,
  sanitizeFilename,
} from "../utils/helpers.util.js";
import { logger } from "../utils/logger.util.js";
import { BadRequestError } from "../utils/errors.util.js";

interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

interface UploadOptions {
  folder?: string;
  filename?: string;
  contentType?: string;
  public?: boolean;
}

/**
 * Upload a file to R2 storage
 */
export const uploadFile = async (
  file: Express.Multer.File,
  options: UploadOptions = {},
): Promise<UploadResult> => {
  const filename =
    options.filename || generateUniqueFilename(file.originalname);
  const sanitizedFilename = sanitizeFilename(filename);
  const folder = options.folder ? `${options.folder}/` : "";
  const key = `${folder}${sanitizedFilename}`;
  const contentType = options.contentType || file.mimetype;

  try {
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: contentType,
      ContentLength: file.size,
    });

    await r2Client.send(command);

    const url = options.public
      ? `${r2Config.publicUrl}/${key}`
      : await getSignedDownloadUrl(key);

    logger.info("File uploaded successfully:", { key, size: file.size });

    return {
      key,
      url,
      size: file.size,
      contentType,
    };
  } catch (error) {
    logger.error("Error uploading file:", error);
    throw new BadRequestError("Failed to upload file");
  }
};

/**
 * Upload multiple files
 */
export const uploadFiles = async (
  files: Express.Multer.File[],
  options: UploadOptions = {},
): Promise<UploadResult[]> => {
  return Promise.all(files.map((file) => uploadFile(file, options)));
};

/**
 * Upload a buffer directly
 */
export const uploadBuffer = async (
  buffer: Buffer,
  filename: string,
  contentType: string,
  options: UploadOptions = {},
): Promise<UploadResult> => {
  const sanitizedFilename = sanitizeFilename(filename);
  const folder = options.folder ? `${options.folder}/` : "";
  const key = `${folder}${sanitizedFilename}`;

  try {
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentLength: buffer.length,
    });

    await r2Client.send(command);

    const url = options.public
      ? `${r2Config.publicUrl}/${key}`
      : await getSignedDownloadUrl(key);

    logger.info("Buffer uploaded successfully:", { key, size: buffer.length });

    return {
      key,
      url,
      size: buffer.length,
      contentType,
    };
  } catch (error) {
    logger.error("Error uploading buffer:", error);
    throw new BadRequestError("Failed to upload file");
  }
};

/**
 * Get a signed download URL
 */
export const getSignedDownloadUrl = async (
  key: string,
  expiresIn: number = 3600, // 1 hour
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: r2Config.bucketName,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
};

/**
 * Get a signed upload URL
 */
export const getSignedUploadUrl = async (
  key: string,
  contentType: string,
  expiresIn: number = 3600, // 1 hour
): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: r2Config.bucketName,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (key: string): Promise<boolean> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
    });

    await r2Client.send(command);
    logger.info("File deleted successfully:", { key });
    return true;
  } catch (error) {
    logger.error("Error deleting file:", error);
    return false;
  }
};

/**
 * Check if a file exists
 */
export const fileExists = async (key: string): Promise<boolean> => {
  try {
    const command = new HeadObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get file metadata
 */
export const getFileMetadata = async (
  key: string,
): Promise<{
  contentType: string;
  size: number;
  lastModified: Date;
} | null> => {
  try {
    const command = new HeadObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
    });

    const response = await r2Client.send(command);

    return {
      contentType: response.ContentType || "application/octet-stream",
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
    };
  } catch {
    return null;
  }
};

/**
 * Generate a unique path for school uploads
 */
export const generateSchoolPath = (
  schoolId: string,
  folder: string,
  filename: string,
): string => {
  const uniqueFilename = generateUniqueFilename(filename);
  return `schools/${schoolId}/${folder}/${uniqueFilename}`;
};

/**
 * Upload school logo
 */
export const uploadSchoolLogo = async (
  schoolId: string,
  file: Express.Multer.File,
): Promise<UploadResult> => {
  return uploadFile(file, {
    folder: `schools/${schoolId}/logo`,
    public: true,
  });
};

/**
 * Upload user avatar
 */
export const uploadUserAvatar = async (
  userId: string,
  file: Express.Multer.File,
): Promise<UploadResult> => {
  return uploadFile(file, {
    folder: `users/${userId}/avatar`,
    public: true,
  });
};

/**
 * Upload student document
 */
export const uploadStudentDocument = async (
  schoolId: string,
  studentId: string,
  file: Express.Multer.File,
): Promise<UploadResult> => {
  return uploadFile(file, {
    folder: `schools/${schoolId}/students/${studentId}/documents`,
    public: false,
  });
};

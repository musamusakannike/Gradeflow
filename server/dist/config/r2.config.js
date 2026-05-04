"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.r2Config = exports.r2Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.warn('R2 configuration is incomplete. File uploads will not work.');
}
exports.r2Client = new client_s3_1.S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});
exports.r2Config = {
    bucketName: process.env.R2_BUCKET_NAME || 'gradeflow',
    publicUrl: process.env.R2_PUBLIC_URL || '',
    accountId: process.env.R2_ACCOUNT_ID || '',
};
//# sourceMappingURL=r2.config.js.map
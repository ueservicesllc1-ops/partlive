import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

export const b2Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT || '',
  region: process.env.B2_REGION || '',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID || '',
    secretAccessKey: process.env.B2_APPLICATION_KEY || '',
  },
  forcePathStyle: true,
});

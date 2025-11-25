import { S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env';

const credentials =
  env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        sessionToken: env.AWS_SESSION_TOKEN
      }
    : undefined;

export const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials
});

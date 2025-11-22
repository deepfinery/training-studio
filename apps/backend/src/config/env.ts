import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('4000'),
  AWS_REGION: z.string().min(1).default('us-west-2'),
  S3_DATA_BUCKET: z.string().min(1).default('deepfinery-training-data'),
  S3_MODEL_BUCKET: z.string().min(1).default('deepfinery-trained-models'),
  AWS_PROFILE: z.string().optional(),
  COGNITO_USER_POOL_ID: z.string().optional().default(''),
  COGNITO_CLIENT_ID: z.string().optional().default(''),
  COGNITO_DOMAIN: z.string().optional().default(''),
  COGNITO_REDIRECT_URI: z.string().optional().default(''),
  COGNITO_GOOGLE_IDP: z.string().optional().default('Google'),
  DOCUMENTDB_URI: z.string().min(1).default('mongodb://localhost:27017'),
  DOCUMENTDB_DB: z.string().min(1).default('training-studio'),
  DOCUMENTDB_TLS_CA_FILE: z.string().optional().default(''),
  ALLOW_DEV_AUTH: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .default('true')
    .transform(value => value === true || value === 'true'),
  HUGGINGFACE_API_TOKEN: z.string().optional(),
  GCP_PROJECT: z.string().optional(),
  GCS_BUCKET: z.string().optional()
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  AWS_REGION: process.env.AWS_REGION,
  S3_DATA_BUCKET: process.env.S3_DATA_BUCKET,
  S3_MODEL_BUCKET: process.env.S3_MODEL_BUCKET,
  AWS_PROFILE: process.env.AWS_PROFILE,
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
  COGNITO_DOMAIN: process.env.COGNITO_DOMAIN,
  COGNITO_REDIRECT_URI: process.env.COGNITO_REDIRECT_URI,
  COGNITO_GOOGLE_IDP: process.env.COGNITO_GOOGLE_IDP,
  DOCUMENTDB_URI: process.env.DOCUMENTDB_URI,
  DOCUMENTDB_DB: process.env.DOCUMENTDB_DB,
  DOCUMENTDB_TLS_CA_FILE: process.env.DOCUMENTDB_TLS_CA_FILE,
  ALLOW_DEV_AUTH: process.env.ALLOW_DEV_AUTH,
  HUGGINGFACE_API_TOKEN: process.env.HUGGINGFACE_API_TOKEN,
  GCP_PROJECT: process.env.GCP_PROJECT,
  GCS_BUCKET: process.env.GCS_BUCKET
});

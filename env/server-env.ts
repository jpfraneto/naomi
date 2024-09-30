import dotenv from 'dotenv';
import { object, parse, string } from 'valibot'

dotenv.config();

const envSchema = object({
    SECRET: string('SECRET is required'),
    AIRSTACK_API_KEY: string("AIRSTACK_API_KEY is required"),
    DATABASE_URL: string("DATABASE_URL is required"),
  });
  
export const {
  SECRET,
  AIRSTACK_API_KEY,
  DATABASE_URL,
} = parse(envSchema, process.env);
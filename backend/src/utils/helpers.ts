// ===========================================
// Planejar Patrimônio - Utility Functions
// ===========================================

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

/**
 * Generate a UUID v4
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random password
 */
export function generateRandomPassword(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Convert snake_case to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Transform database row (snake_case) to JS object (camelCase)
 */
export function transformRow<T>(row: any): T {
  if (!row) return row;
  
  const transformed: any = {};
  for (const key in row) {
    transformed[snakeToCamel(key)] = row[key];
  }
  return transformed as T;
}

/**
 * Transform multiple rows
 */
export function transformRows<T>(rows: any[]): T[] {
  return rows.map(row => transformRow<T>(row));
}

/**
 * Format date to MySQL format
 */
export function formatDateForDB(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Sleep helper for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Omit keys from object
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

/**
 * Pick keys from object
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Safely extract string from query parameter
 * Query params can be string | string[] | undefined
 */
export function queryToString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/**
 * Safely extract number from query parameter
 */
export function queryToNumber(value: string | string[] | undefined): number | undefined {
  const str = queryToString(value);
  if (str === undefined) return undefined;
  const num = parseInt(str, 10);
  return isNaN(num) ? undefined : num;
}

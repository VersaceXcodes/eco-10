```javascript
import { z } from 'zod';

// Users
export const userEntitySchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  name: z.string(),
  user_type: z.string(),
  location: z.string().nullable(),
  eco_interests: z.any().nullable(),
  created_at: z.coerce.date(),
});

export const createUserInputSchema = z.object({
  email: z.string().email().min(1).max(255),
  password_hash: z.string().min(8),
  name: z.string().min(1).max(100),
  user_type: z.string().optional(),
  location: z.string().nullable().optional(),
  eco_interests: z.any().nullable().optional(),
});

export const updateUserInputSchema = z.object({
  id: z.string().required(),
  email: z.string().email().optional(),
  password_hash: z.string().min(8).optional(),
  name: z.string().min(1).max(100).optional(),
  user_type: z.string().optional(),
  location: z.string().nullable().optional(),
  eco_interests: z.any().nullable().optional(),
});

export const searchUsersInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['id', 'email', 'name', 'user_type', 'created_at', 'location']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type UserEntity = z.infer<typeof userEntitySchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersInputSchema>;


// User Impact
export const userImpactEntitySchema = z.object({
  id: z.string(),
  user_id: z.string(),
  date: z.coerce.date(),
  daily_score: z.number(),
  weekly_score: z.number(),
  monthly_score: z.number(),
  category_breakdown: z.any(),
});

export const createUserImpactInputSchema = z.object({
  user_id: z.string().required(),
  date: z.coerce.date().required(),
  daily_score: z.number().required(),
  weekly_score: z.number().required(),
  monthly_score: z.number().required(),
  category_breakdown: z.any().required(),
});

export const updateUserImpactInputSchema = z.object({
  id: z.string().required(),
  user_id: z.string().optional(),
  date: z.coerce.date().optional(),
  daily_score: z.number().optional(),
  weekly_score: z.number().optional(),
  monthly_score: z.number().optional(),
  category_breakdown: z.any().optional(),
});

export const searchUserImpactInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['user_id', 'date', 'daily_score', 'weekly_score', 'monthly_score']).default('date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type UserImpactEntity = z.infer<typeof userImpactEntitySchema>;
export type CreateUserImpactInput = z.infer<typeof createUserImpactInputSchema>;
export type UpdateUserImpactInput = z.infer<typeof updateUserImpactInputSchema>;
export type SearchUserImpactInput = z.infer<typeof searchUserImpactInputSchema>;


// Transportation Logs
export const transportationLogEntitySchema = z.object({
  id:
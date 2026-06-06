import { z } from 'zod';


export const RegisterSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name too long'),

  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  workspaceName: z.string()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(50, 'Workspace name too long'),
});



export const LoginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),

  password: z.string()
    .min(1, 'Password is required'),
});
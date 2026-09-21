
import { z } from "zod";

export const userRoleSchema = z.enum([
    "User",
    "Admin",
    "Attestant",
    "Initiator",
]);

export const currentUserSchema = z.object({
    userId: z.coerce.number(),
    name: z.string(),
    email: z.string().email(),
    role: userRoleSchema,
    tenantId: z.coerce.number(),
});

export const readUserSchema = z.object({
    id: z.number(),
    tenantId: z.number(),
    name: z.string(),
    email: z.string().email(),
    role: userRoleSchema,
});

export const readUsersSchema =
    z.array(readUserSchema);

export const createUserSchema = z.object({
    tenantId: z.number(),
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(1),
    role: userRoleSchema,
});

export const updateUserSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().max(100).optional(),
    password: z.string().min(1).max(60).optional(),
    role: userRoleSchema.optional(),
});


export const loginResponseSchema = z.object({
    token: z.string(),
    userId: z.number(),
    email: z.string().email(),
    role: userRoleSchema,
    tenantId: z.number(),
});

export type UserRole = z.infer<
    typeof userRoleSchema
>;

export type AuthUser = z.infer<
    typeof currentUserSchema
>;

export type ReadUser = z.infer<
    typeof readUserSchema
>;

export type CreateUser = z.infer<
    typeof createUserSchema
>;

export type LoginResponse = z.infer<
    typeof loginResponseSchema
>;

export type UpdateUser = z.infer<
    typeof updateUserSchema
>;
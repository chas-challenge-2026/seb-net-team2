import { z } from "zod";

export const loginResponseSchema = z.object({
    token: z.string(),
    userId: z.number(),
    email: z.string().email(),
    role: z.string(),
    tenantId: z.number(),
});

export const currentUserSchema = z.object({
    userId: z.coerce.number(),
    email: z.string().email().optional(),
    role: z.string(),
    tenantId: z.coerce.number(),
});

export type LoginResponse = z.infer<
    typeof loginResponseSchema
>;

export type AuthUser = z.infer<
    typeof currentUserSchema
>;
import { apiRequest } from "./apiRequest";
import { z } from 'zod';

import {
    currentUserSchema,
    loginResponseSchema,
    readUserSchema,
    readUsersSchema,
    updateUserSchema,
    type CreateUser,
    type UpdateUser,
} from "../schemas/userSchema";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    throw new Error(
        "VITE_API_URL is not configured."
    );
}

export async function loginUser(
    email: string,
    password: string
) {
    return apiRequest(
        `${API_URL}/api/auth/login`,
        loginResponseSchema,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        }
    );
}

export async function getCurrentUser() {
    return apiRequest(
        `${API_URL}/api/auth/me`,
        currentUserSchema
    );
}

export async function getAllUsers() {
    return apiRequest(
        `${API_URL}/api/users`,
        readUsersSchema,
    );
}

export async function getUserById(id: number) {
    return apiRequest(
        `${API_URL}/api/users/${id}`,
        readUserSchema,
    );
}

export async function createUser(
    user: CreateUser
) {
    return apiRequest(
        `${API_URL}/api/users`,
        readUserSchema,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
        }
    );
}

export async function deleteUserById(
    id: number
): Promise<void> {
    return apiRequest(
        `${API_URL}/api/users/${id}`,
        z.void(),
        {
            method: "DELETE",
        }
    );
}

export async function updateUserById(
    id: number,
    user: UpdateUser,
) {
    return apiRequest(
        `${API_URL}/api/users/${id}`,
        updateUserSchema,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
        }
    );
}
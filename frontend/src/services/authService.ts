import { apiRequest } from "./apiRequest";

import {
    currentUserSchema,
    loginResponseSchema,
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
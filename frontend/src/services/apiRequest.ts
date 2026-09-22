import { z } from "zod";

import { AppError } from "../errors/AppError";
import { createAppError } from "../errors/createAppError";

import {
    getAuthToken,
    removeAuthToken,
} from "../utils/authStorage";

import {
    notifySessionExpired,
} from "../utils/authEvents";

export async function apiRequest<T extends z.ZodType>(
    url: string,
    schema: T,
    options?: RequestInit
): Promise<z.output<T>> {
    const headers = new Headers(options?.headers);

    const token = getAuthToken();

    if (token && !headers.has("Authorization")) {
        headers.set(
            "Authorization",
            `Bearer ${token}`
        );
    }

    let response: Response;

    try {
        response = await fetch(url, {
            ...options,
            headers,
        });
    } catch {
        throw new AppError(
            "Unable to connect to the server."
        );
    }

    if (!response.ok) {
        if (
            response.status === 401 &&
            token
        ) {
            removeAuthToken();
            notifySessionExpired();
        }

        throw await createAppError(response);
    }

    if (response.status === 204) {
        return schema.parse(undefined);
    }

    const data: unknown = await response.json();

    return schema.parse(data);
}
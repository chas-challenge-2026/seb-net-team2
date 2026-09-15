import { z } from "zod";

import { AppError } from "../errors/AppError";
import { createAppError } from "../errors/createAppError";
import { getAuthToken } from "../utils/authStorage";

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
        throw await createAppError(response);
    }

    const data: unknown = await response.json();

    return schema.parse(data);
}
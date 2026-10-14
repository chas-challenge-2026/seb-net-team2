import i18n from "../i18n/i18n";
import { AppError } from './AppError';
import type { ProblemDetails } from "./ProblemDetails";

export async function createAppError(
    response: Response
): Promise<AppError> {
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("json")) {
        try {
            const data: unknown = await response.json();

            if (typeof data === "string") {
                return new AppError(
                    data,
                    response.status
                );
            }

            const problem = data as ProblemDetails;

            return new AppError(
                problem.title ?? i18n.t("errors.request"),
                response.status,
                problem.detail
            );
        } catch {
            return new AppError(
                i18n.t("errors.request"),
                response.status
            );
        }
    }

    const message = await response.text();

    return new AppError(
        message || i18n.t("errors.request"),
        response.status
    );
}
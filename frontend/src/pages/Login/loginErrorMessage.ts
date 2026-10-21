import type { TFunction } from "i18next";
import { AppError } from "../../errors/AppError";

export function getLoginErrorMessage(error: unknown, t: TFunction): string {
    if (!(error instanceof AppError)) return t("login.generic");
    if (error.status === 401) return t("login.invalidCredentials");
    if (error.status !== undefined && error.status >= 500) return t("login.unavailable");
    if (error.status === undefined) return t("login.connectionFailed");
    return error.detail ?? error.message;
}

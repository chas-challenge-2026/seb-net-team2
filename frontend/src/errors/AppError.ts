export class AppError extends Error {
    status?: number;
    detail?: string;

    constructor(
        message: string,
        status?: number,
        detail?: string
    ) {
        super(message);

        this.name = "AppError";
        this.status = status;
        this.detail = detail;
    }
}
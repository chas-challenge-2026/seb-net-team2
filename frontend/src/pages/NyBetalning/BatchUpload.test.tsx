import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { ReactNode } from "react";

import { BatchUpload } from "./BatchUpload";
import { uploadPaymentBatch } from "../../services/accountService";
import { useAccounts } from "../../hooks/useAccounts";
import { AppError } from "../../errors/AppError";
import type { CreatedPayment } from "../../schemas/paymentSchema";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => {
            const translations: Record<string, string> = {
                "batch.file.label": "CSV file",
                "batch.file.selected": "Selected file: {{name}}",
                "batch.actions.review": "Review payments",
                "batch.actions.create": "Create {{count}} payments",
                "batch.actions.newFile": "Upload a new file",
                "batch.review.title": "Review the payments",
                "batch.review.summary": "{{count}} payments from {{file}}.",
                "batch.review.duplicateTitle": "This file seems to have been uploaded already",
                "batch.result.createdTitle": "All {{count}} payments were created",
                "batch.result.breakdown": "Completed: {{completed}} · Waiting for approval: {{pending}}",
                "batch.result.invalid": "No payments were sent. {{count}} rows need fixing.",
                "batch.result.rejected": "No payments were created. The server replied: {{reason}}",
                "batch.result.rejectedRow": "No payments were created. Fix the row marked below.",
                "batch.table.notCreated": "Not created",
                "batch.table.accountNumber": "Account {{id}}",
                "batch.errors.invalidAccount": "from_account_id must be an account number (got '{{id}}')",
                "batch.errors.unknownAccount": "Account {{id}} does not belong to your company",
                "batch.errors.numericReference": "The reference cannot contain only digits",
                "payment.actions.goBack": "Go back",
                "payment.result.statusValues.completed": "Completed",
                "payment.result.statusValues.pendingApproval": "Waiting for approval",
            };

            return (translations[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(options?.[name] ?? ""));
        },
        i18n: { resolvedLanguage: "en" },
    }),
}));

jest.mock("@tanstack/react-router", () => ({
    Link: ({ children, to, className }: { children: ReactNode; to: string; className?: string }) => (
        <a href={to} className={className}>{children}</a>
    ),
}));

jest.mock("../../services/accountService", () => ({
    uploadPaymentBatch: jest.fn(),
}));

jest.mock("../../hooks/useAccounts", () => ({ useAccounts: jest.fn() }));

const mockedUploadPaymentBatch = jest.mocked(uploadPaymentBatch);
const mockedUseAccounts = jest.mocked(useAccounts);

const operatingAccountId = "9d21cccb-d39d-4cae-99aa-fda8a311cf66";

const header = "from_account_id,to_iban,amount,reference";

const validCsv = [
    header,
    "1,SE3550000000054910000003,5000,Faktura #2001",
    '1,SE7850000000054910000005,12500.50,"Malmö Bygg, faktura #2002"',
].join("\n");

function csvFile(content: string): File {
    const file = new File([content], "batch.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(content) });
    return file;
}

function chooseCsv(content: string) {
    fireEvent.change(screen.getByLabelText("CSV file"), {
        target: { files: [csvFile(content)] },
    });
    fireEvent.click(screen.getByRole("button", { name: /Review payments/ }));
}

async function reviewAndCreate(content: string) {
    chooseCsv(content);
    fireEvent.click(await screen.findByRole("button", { name: /Create 2 payments/ }));
}

afterEach(() => cleanup());

describe("BatchUpload", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        mockedUploadPaymentBatch.mockResolvedValue([] as CreatedPayment[]);
        mockedUseAccounts.mockReturnValue({
            data: [{ id: operatingAccountId, name: "Operating account", balance: 1000, currency: "SEK", iban: "SE4550000000058398257466" }],
        } as unknown as ReturnType<typeof useAccounts>);
    });

    it("shows the rows for review before anything is sent", async () => {
        render(<BatchUpload />);

        chooseCsv(validCsv);

        expect(await screen.findByRole("heading", { name: "Review the payments" })).toHaveFocus();
        expect(screen.getByText("2 payments from batch.csv.")).toBeInTheDocument();
        expect(screen.getByText(/^17\s500[.,]50 SEK$/)).toBeInTheDocument();
        expect(screen.getByText("Malmö Bygg, faktura #2002")).toBeInTheDocument();
        expect(screen.getAllByText("Account 1")).toHaveLength(2);
        expect(mockedUploadPaymentBatch).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: /Go back/ }));

        expect(screen.getByLabelText("CSV file")).toBeInTheDocument();
        expect(mockedUploadPaymentBatch).not.toHaveBeenCalled();
    });

    it("sends the whole file in one request and shows each payment's status", async () => {
        mockedUploadPaymentBatch.mockResolvedValue([
            { status: "completed", fromAccountId: operatingAccountId },
            { status: "pending_approval", fromAccountId: operatingAccountId },
        ] as CreatedPayment[]);
        render(<BatchUpload />);

        await reviewAndCreate(validCsv);

        expect(await screen.findByRole("heading", { name: "All 2 payments were created" })).toHaveFocus();
        expect(mockedUploadPaymentBatch).toHaveBeenCalledTimes(1);
        expect(mockedUploadPaymentBatch).toHaveBeenCalledWith(
            [
                header,
                '1,SE3550000000054910000003,5000.00,"Faktura #2001"',
                '1,SE7850000000054910000005,12500.50,"Malmö Bygg, faktura #2002"',
            ].join("\n"),
            "batch.csv",
        );
        expect(screen.getByText("Completed: 1 · Waiting for approval: 1")).toBeInTheDocument();
        expect(screen.getAllByText("Operating account")).toHaveLength(2);
        expect(screen.getByText("Completed")).toBeInTheDocument();
        expect(screen.getByText("Waiting for approval")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Upload a new file/ }));

        expect(screen.getByLabelText("CSV file")).toBeInTheDocument();
    });

    it("does not go to review when a row is invalid", async () => {
        render(<BatchUpload />);

        chooseCsv([
            header,
            "1,SE3550000000054910000003,5000.00,Faktura #2001",
            "SE4550000000058398257466,SE7850000000054910000005,100.00,Faktura #2002",
            "1,SE7850000000054910000005,100.00,12345",
        ].join("\n"));

        expect(await screen.findByText("No payments were sent. 2 rows need fixing.")).toBeInTheDocument();
        expect(screen.getByText("from_account_id must be an account number (got 'SE4550000000058398257466')")).toBeInTheDocument();
        expect(screen.getByText("The reference cannot contain only digits")).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "Review the payments" })).not.toBeInTheDocument();
        expect(mockedUploadPaymentBatch).not.toHaveBeenCalled();
    });

    it("warns when the same rows were already created, but still lets the user continue", async () => {
        render(<BatchUpload />);

        chooseCsv(validCsv);
        await screen.findByRole("heading", { name: "Review the payments" });
        expect(screen.queryByText("This file seems to have been uploaded already")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Create 2 payments/ }));
        fireEvent.click(await screen.findByRole("button", { name: /Upload a new file/ }));

        // The same content in a file with another name is still recognised.
        chooseCsv(validCsv.replace("Faktura #2001", " Faktura #2001 "));
        expect(await screen.findByText("This file seems to have been uploaded already")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Create 2 payments/ })).toBeEnabled();
    });

    it("sends the batch only once when the create button is double-clicked", async () => {
        render(<BatchUpload />);

        chooseCsv(validCsv);
        const createButton = await screen.findByRole("button", { name: /Create 2 payments/ });
        fireEvent.click(createButton);
        fireEvent.click(createButton);

        expect(await screen.findByRole("heading", { name: "All 2 payments were created" })).toBeInTheDocument();
        expect(mockedUploadPaymentBatch).toHaveBeenCalledTimes(1);
    });

    it("marks the row when the server does not know the account", async () => {
        mockedUploadPaymentBatch.mockRejectedValue(new AppError("Row 2, Account 9 does NOT exist", 400));
        render(<BatchUpload />);

        await reviewAndCreate(validCsv.replace("\n1,SE785", "\n9,SE785"));

        expect(await screen.findByText("No payments were created. Fix the row marked below.")).toBeInTheDocument();
        expect(screen.getByText("Account 9 does not belong to your company")).toBeInTheDocument();
        expect(screen.getByText("Not created")).toBeInTheDocument();
    });

    it("shows the server's reason when the batch is rejected", async () => {
        mockedUploadPaymentBatch.mockRejectedValue(new AppError("Insufficient balance", 400));
        render(<BatchUpload />);

        await reviewAndCreate(validCsv);

        expect(await screen.findByText("No payments were created. The server replied: Insufficient balance")).toBeInTheDocument();
        expect(screen.getAllByText("Not created")).toHaveLength(2);
        await waitFor(() => expect(screen.getByRole("button", { name: /Review payments/ })).toBeEnabled());
    });
});

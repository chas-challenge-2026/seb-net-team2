import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Granskningslogg } from "./Granskningslogg";
import { fetchAuditLog } from "../../services/auditService";
import { getAllUsers } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";
import type { AuditPage } from "../../schemas/auditSchema";

jest.mock("../../services/auditService", () => ({
    ...jest.requireActual<typeof import("../../services/auditService")>("../../services/auditService"),
    fetchAuditLog: jest.fn(),
}));
jest.mock("../../services/authService", () => ({ getAllUsers: jest.fn() }));
jest.mock("../../hooks/useAuth", () => ({ useAuth: jest.fn() }));

const mockedFetchAuditLog = jest.mocked(fetchAuditLog);
const mockedGetAllUsers = jest.mocked(getAllUsers);
const mockedUseAuth = jest.mocked(useAuth);

function entry(id: number, userId: number, userName: string) {
    return {
        id, timeStamp: "2026-11-02T10:00:00Z", userId, userName,
        action: "APPROVE_STEP", entityType: "payment", entityId: 155, description: "",
    };
}

const page: AuditPage = {
    items: [entry(1, 4, "Johan Berg"), entry(2, 3, "Hanna Andersson"), entry(3, 4, "Johan Berg")],
    totalCount: 3,
    page: 1,
    pageSize: 200,
};

function renderLog() {
    return render(
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <Granskningslogg />
        </QueryClientProvider>
    );
}

beforeEach(() => {
    jest.clearAllMocks();
    mockedFetchAuditLog.mockResolvedValue(page);
    mockedUseAuth.mockReturnValue({
        user: { id: "johan", name: "Johan Berg", role: "Attestant" },
    } as unknown as ReturnType<typeof useAuth>);
});
afterEach(() => cleanup());

describe("Filtering the audit log on a user", () => {
    it("lets an attestant pick a colleague from the people in the log", async () => {
        renderLog();

        const select = await screen.findByLabelText("Användare");
        await waitFor(() => expect(within(select).getAllByRole("option")).toHaveLength(3));
        expect(within(select).getAllByRole("option").map((option) => option.textContent))
            .toEqual(["Alla användare", "Hanna Andersson", "Johan Berg"]);
        // The user list is admin only, so it is never asked for.
        expect(mockedGetAllUsers).not.toHaveBeenCalled();

        fireEvent.change(select, { target: { value: "3" } });

        await waitFor(() => expect(mockedFetchAuditLog).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 3, userPublicId: undefined }), 1, expect.any(Number)
        ));
    });

    it("has no user filter when only one person is in the log", async () => {
        mockedFetchAuditLog.mockResolvedValue({ ...page, items: [entry(1, 4, "Johan Berg")] });
        renderLog();

        await waitFor(() => expect(mockedFetchAuditLog).toHaveBeenCalledTimes(2));
        expect(screen.queryByLabelText("Användare")).not.toBeInTheDocument();
    });
});

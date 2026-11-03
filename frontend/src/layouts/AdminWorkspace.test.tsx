import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { AdminWorkspace } from "./AdminWorkspace";
import { useApprovals } from "../hooks/useApprovals";

jest.mock("@tanstack/react-router", () => ({
    Link: ({ children, to, ...props }: React.PropsWithChildren<{ to: string }>) => (
        <a href={to} {...props}>{children}</a>
    ),
    useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => string }) =>
        select({ location: { pathname: "/ny-betalning" } }),
}));

jest.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../hooks/useApprovals", () => ({ useApprovals: jest.fn() }));

const mockedUseApprovals = jest.mocked(useApprovals);

afterEach(() => cleanup());

describe("AdminWorkspace", () => {
    it("shows overview and new payment tabs for an initiator and marks the current page", () => {
        mockedUseApprovals.mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useApprovals>);

        render(<AdminWorkspace variant="initiator"><p>Content</p></AdminWorkspace>);

        const links = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
        expect(links).toEqual(["/dashboard", "/ny-betalning"]);
        expect(screen.getByRole("link", { name: "sidebar.newPayment" })).toHaveAttribute("aria-current", "page");
        expect(screen.getByRole("link", { name: "sidebar.dashboard" })).not.toHaveAttribute("aria-current");
    });

    it("does not fetch pending approvals for an initiator", () => {
        mockedUseApprovals.mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useApprovals>);

        render(<AdminWorkspace variant="initiator"><p>Content</p></AdminWorkspace>);

        expect(mockedUseApprovals).toHaveBeenCalledWith(false);
    });

    it("still fetches pending approvals for an attestant", () => {
        mockedUseApprovals.mockReturnValue({ data: [] } as unknown as ReturnType<typeof useApprovals>);

        render(<AdminWorkspace variant="attestant"><p>Content</p></AdminWorkspace>);

        expect(mockedUseApprovals).toHaveBeenCalledWith(true);
    });

    it("shows the organization name for an admin and an attestant but not for an initiator", () => {
        mockedUseApprovals.mockReturnValue({ data: [] } as unknown as ReturnType<typeof useApprovals>);

        const { rerender } = render(
            <AdminWorkspace variant="admin" organization="Malmö Bygg AB"><p>Content</p></AdminWorkspace>
        );
        expect(screen.getByText("Malmö Bygg AB")).toBeInTheDocument();

        rerender(<AdminWorkspace variant="attestant" organization="Malmö Bygg AB"><p>Content</p></AdminWorkspace>);
        expect(screen.getByText("Malmö Bygg AB")).toBeInTheDocument();

        rerender(<AdminWorkspace variant="initiator" organization="Malmö Bygg AB"><p>Content</p></AdminWorkspace>);
        expect(screen.queryByText("Malmö Bygg AB")).not.toBeInTheDocument();
    });
});

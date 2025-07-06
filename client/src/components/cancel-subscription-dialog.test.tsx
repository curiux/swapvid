/**
 * Tests for the <CancelSubscriptionDialog /> component.
 *
 * This file contains automated tests that verify:
 * - The dialog opens and closes as expected.
 * - The cancellation process sends a PUT request and handles responses.
 * - Navigates to home on 401/404, to error page on other errors, and reloads on success.
 * - Handles loading and error states correctly.
 *
 * Mocks are used for navigation, fetch, and localStorage to isolate component logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import CancelSubscriptionDialog from "./cancel-subscription-dialog";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
    const mod = await vi.importActual("react-router");
    return {
        ...mod,
        useNavigate: () => mockNavigate,
    };
});

beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    mockNavigate.mockReset();
});

describe("CancelSubscriptionDialog", () => {
    it("abre y cierra el diálogo", () => {
        render(
            <MemoryRouter>
                <CancelSubscriptionDialog isCancelled={false} />
            </MemoryRouter>
        );
        // Open dialog
        fireEvent.click(screen.getByText(/cancelar/i));
        expect(screen.getByRole("dialog")).toBeTruthy();
        // Close dialog
        fireEvent.click(screen.getByRole("button", { name: /volver/i }));
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("envía PUT y recarga al cancelar con éxito", async () => {
        localStorage.setItem("token", "tok123");
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({}),
        }) as any;
        render(
            <MemoryRouter>
                <CancelSubscriptionDialog isCancelled={false} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getAllByText(/cancelar/i)[0]);
        await waitFor(() => {
            fireEvent.click(screen.getByRole("button", { name: /^cancelar$/i }));
        });
        await waitFor(() => {
            expect(localStorage.getItem("msg")).toMatch(/canceló/i);
            expect(mockNavigate).toHaveBeenCalledWith(0);
        });
    });

    it("navega a home en 401/404", async () => {
        localStorage.setItem("token", "tok123");
        global.fetch = vi.fn().mockResolvedValue({
            status: 401,
            json: async () => ({ error: "Unauthorized" }),
        }) as any;
        render(
            <MemoryRouter>
                <CancelSubscriptionDialog isCancelled={false} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getAllByText(/cancelar/i)[0]);
        await waitFor(() => {
            fireEvent.click(screen.getByRole("button", { name: /^cancelar$/i }));
        });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
    });

    it("navega a error en otros errores del backend", async () => {
        localStorage.setItem("token", "tok123");
        global.fetch = vi.fn().mockResolvedValue({
            status: 400,
            json: async () => ({ error: "Backend error" }),
        }) as any;
        render(
            <MemoryRouter>
                <CancelSubscriptionDialog isCancelled={false} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getAllByText(/cancelar/i)[0]);
        await waitFor(() => {
            fireEvent.click(screen.getByRole("button", { name: /^cancelar$/i }));
        });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining("/error?msg="));
        });
    });

    it("navega a error en excepción de fetch", async () => {
        localStorage.setItem("token", "tok123");
        global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
        render(
            <MemoryRouter>
                <CancelSubscriptionDialog isCancelled={false} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getAllByText(/cancelar/i)[0]);
        await waitFor(() => {
            fireEvent.click(screen.getByRole("button", { name: /^cancelar$/i }));
        });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });
});

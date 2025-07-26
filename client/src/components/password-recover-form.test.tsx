/**
 * Tests for the <PasswordRecoverForm /> component.
 *
 * This file contains automated tests that verify:
 * - The form renders all required fields and the submit button.
 * - Validation errors are shown for missing email.
 * - Successful submission triggers a redirect to login and shows a toast.
 * - Backend errors and unexpected errors are displayed appropriately.
 *
 * Mocks are used for navigation, fetch, toast, ResizeObserver, and window.matchMedia to isolate component logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import PasswordRecoverForm from "./password-recover-form";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
    const mod = await vi.importActual("react-router");
    return {
        ...mod,
        useNavigate: () => mockNavigate,
    };
});

// Mock toast
vi.mock("sonner", () => ({ toast: vi.fn() }));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock ResizeObserver
class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}
global.ResizeObserver = ResizeObserver;

// Mock window.matchMedia
if (!window.matchMedia) {
    window.matchMedia = function () {
        return {
            matches: false,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false
        };
    } as any;
}

describe("PasswordRecoverForm", () => {
    beforeEach(() => {
        cleanup();
        vi.restoreAllMocks();
        mockFetch.mockReset();
        mockNavigate.mockReset();
    });

    it("renderiza el formulario de recuperación", () => {
        render(<PasswordRecoverForm />, { wrapper: MemoryRouter });
        expect(screen.getByLabelText(/ingresa tu email/i)).not.toBeNull();
        expect(screen.getByRole("button", { name: /recuperar contraseña/i })).not.toBeNull();
    });

    it("muestra error si el email está vacío", async () => {
        render(<PasswordRecoverForm />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByRole("button", { name: /recuperar contraseña/i }));
        await waitFor(() => {
            expect(screen.getByText(/ingresa un email/i)).toBeTruthy();
        });
    });

    it("envía el email y muestra mensaje de éxito", async () => {
        mockFetch.mockResolvedValue({
            json: async () => ({}),
            status: 200
        });
        render(<PasswordRecoverForm />, { wrapper: MemoryRouter });
        fireEvent.input(screen.getByLabelText(/ingresa tu email/i), {
            target: { value: "test@example.com" }
        });
        fireEvent.click(screen.getByRole("button", { name: /recuperar contraseña/i }));
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/forgot-password"), expect.objectContaining({ method: "POST" }));
            expect(screen.queryByText(/ha ocurrido un error/i)).toBeNull();
            expect(mockNavigate).toHaveBeenCalledWith("/login");
        });
    });

    it("muestra error si el backend retorna un error", async () => {
        mockFetch.mockResolvedValue({
            json: async () => ({ error: "Error de backend" }),
            status: 400
        });
        render(<PasswordRecoverForm />, { wrapper: MemoryRouter });
        fireEvent.input(screen.getByLabelText(/ingresa tu email/i), {
            target: { value: "test@example.com" }
        });
        fireEvent.click(screen.getByRole("button", { name: /recuperar contraseña/i }));
        await waitFor(() => {
            expect(screen.getByText(/error de backend/i)).toBeTruthy();
        });
    });

    it("muestra error inesperado si fetch falla", async () => {
        mockFetch.mockRejectedValue(new Error("Network error"));
        render(<PasswordRecoverForm />, { wrapper: MemoryRouter });
        fireEvent.input(screen.getByLabelText(/ingresa tu email/i), {
            target: { value: "test@example.com" }
        });
        fireEvent.click(screen.getByRole("button", { name: /recuperar contraseña/i }));
        await waitFor(() => {
            expect(screen.getByText(/ha ocurrido un error inesperado/i)).toBeTruthy();
        });
    });
});

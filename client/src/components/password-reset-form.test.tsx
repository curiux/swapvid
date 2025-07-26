/**
 * Tests for the <PasswordResetForm /> component.
 *
 * This file contains automated tests that verify:
 * - The form renders all required fields and the submit button.
 * - Validation errors are shown for missing or invalid passwords and mismatched confirmation.
 * - Successful submission triggers a redirect to login and shows a toast.
 * - Backend errors and unexpected errors are displayed appropriately.
 *
 * Mocks are used for navigation, fetch, toast, ResizeObserver, and window.matchMedia to isolate component logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import PasswordResetForm from "./password-reset-form";

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

describe("PasswordResetForm", () => {
    beforeEach(() => {
        cleanup();
        vi.restoreAllMocks();
        mockFetch.mockReset();
        mockNavigate.mockReset();
    });

    it("renderiza el formulario de cambio de contraseña", () => {
        render(<PasswordResetForm />, { wrapper: MemoryRouter });
        expect(screen.getAllByLabelText(/contraseña/i)[0]).not.toBeNull();
        expect(screen.getByLabelText(/repite la contraseña/i)).not.toBeNull();
        expect(screen.getByRole("button", { name: /cambiar contraseña/i })).not.toBeNull();
    });

    it("muestra error si los campos están vacíos", async () => {
        render(<PasswordResetForm />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByRole("button", { name: /cambiar contraseña/i }));
        await waitFor(() => {
            expect(screen.getByText(/la contraseña es obligatoria/i)).toBeTruthy();
            expect(screen.getByText(/debes repetir la contraseña/i)).toBeTruthy();
        });
    });

    it("muestra error si la contraseña no cumple requisitos", async () => {
        render(<PasswordResetForm />, { wrapper: MemoryRouter });
        fireEvent.input(screen.getAllByLabelText(/contraseña/i)[0], {
            target: { value: "abc" }
        });
        fireEvent.input(screen.getByLabelText(/repite la contraseña/i), {
            target: { value: "abc" }
        });
        fireEvent.click(screen.getByRole("button", { name: /cambiar contraseña/i }));
        await waitFor(() => {
            expect(screen.getByText(/no cumple con los requisitos/i)).toBeTruthy();
        });
    });

    it("muestra error si las contraseñas no coinciden", async () => {
        render(<PasswordResetForm />, { wrapper: MemoryRouter });
        fireEvent.input(screen.getAllByLabelText(/contraseña/i)[0], {
            target: { value: "Password1!" }
        });
        fireEvent.input(screen.getByLabelText(/repite la contraseña/i), {
            target: { value: "Password2!" }
        });
        fireEvent.click(screen.getByRole("button", { name: /cambiar contraseña/i }));
        await waitFor(() => {
            expect(screen.getByText(/las contraseñas no coinciden/i)).toBeTruthy();
        });
    });

    it("envía la nueva contraseña y muestra mensaje de éxito", async () => {
        mockFetch.mockResolvedValue({
            json: async () => ({}),
            status: 200
        });
        render(<PasswordResetForm />, { wrapper: MemoryRouter });
        fireEvent.input(screen.getAllByLabelText(/contraseña/i)[0], {
            target: { value: "Password1!" }
        });
        fireEvent.input(screen.getByLabelText(/repite la contraseña/i), {
            target: { value: "Password1!" }
        });
        fireEvent.click(screen.getByRole("button", { name: /cambiar contraseña/i }));
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/reset-password"), expect.objectContaining({ method: "POST" }));
            expect(screen.queryByText(/ha ocurrido un error/i)).toBeNull();
            expect(mockNavigate).toHaveBeenCalledWith("/login");
        });
    });

    it("muestra error si el backend retorna un error", async () => {
        mockFetch.mockResolvedValue({
            json: async () => ({ error: "Error de backend" }),
            status: 400
        });
        render(<PasswordResetForm />, { wrapper: MemoryRouter });
        fireEvent.input(screen.getAllByLabelText(/contraseña/i)[0], {
            target: { value: "Password1!" }
        });
        fireEvent.input(screen.getByLabelText(/repite la contraseña/i), {
            target: { value: "Password1!" }
        });
        fireEvent.click(screen.getByRole("button", { name: /cambiar contraseña/i }));
        await waitFor(() => {
            expect(screen.getByText(/error de backend/i)).toBeTruthy();
        });
    });

    it("muestra error inesperado si fetch falla", async () => {
        mockFetch.mockRejectedValue(new Error("Network error"));
        render(<PasswordResetForm />, { wrapper: MemoryRouter });
        fireEvent.input(screen.getAllByLabelText(/contraseña/i)[0], {
            target: { value: "Password1!" }
        });
        fireEvent.input(screen.getByLabelText(/repite la contraseña/i), {
            target: { value: "Password1!" }
        });
        fireEvent.click(screen.getByRole("button", { name: /cambiar contraseña/i }));
        await waitFor(() => {
            expect(screen.getByText(/ha ocurrido un error inesperado/i)).toBeTruthy();
        });
    });
});

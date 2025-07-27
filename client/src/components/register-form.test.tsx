/**
 * Tests for the <RegisterForm /> component.
 * 
 * This file contains automated tests that verify the following behaviors:
 * - The registration form renders all required fields and the submit button.
 * - Validation errors are shown when the form is incomplete or passwords do not match.
 * - Successful form submission triggers a redirect to the verify email page.
 * - Backend errors are displayed appropriately to the user.
 * 
 * Mocks are used for navigation, fetch requests, ResizeObserver and window.matchMedia to isolate component logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import RegisterForm from "./register-form";

// Mock ResizeObserver
class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}
global.ResizeObserver = ResizeObserver;

// Mock Navigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
    const mod = await vi.importActual("react-router");
    return {
        ...mod,
        useNavigate: () => mockNavigate,
    };
});

// Mock window.matchMedia
if (!window.matchMedia) {
    window.matchMedia = function () {
        return {
            matches: false,
            addEventListener: () => { },
            removeEventListener: () => { },
            addListener: () => { },
            removeListener: () => { },
            dispatchEvent: () => false
        };
    } as any;
}

describe("RegisterForm", () => {
    beforeEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it("renderiza el formulario de registro", () => {
        render(<RegisterForm />, { wrapper: MemoryRouter });

        expect(screen.getAllByLabelText(/email/i)).not.toBeNull();
        expect(screen.getAllByLabelText(/nombre de usuario/i)).not.toBeNull();
        expect(screen.getAllByLabelText(/contraseña/i)).not.toBeNull();
        expect(screen.getAllByLabelText(/repite la contraseña/i)).not.toBeNull();
        expect(screen.getAllByLabelText(/acepto los/i)).not.toBeNull();
        expect(screen.getAllByRole("button", { name: /registrarse/i })).not.toBeNull();
    });

    it("muestra errores si el formulario está incompleto", async () => {
        render(<RegisterForm />, { wrapper: MemoryRouter });

        fireEvent.click(screen.getAllByRole("button", { name: /registrarse/i })[0]);

        await waitFor(() => {
            expect(screen.getAllByText(/es obligatori/i).length).toBeGreaterThan(2);
            expect(screen.getAllByText(/es obligatori/i).length).toBeLessThan(4);
            expect(screen.getAllByText(/Debes repetir la/i).length).not.toBeNull();
            expect(screen.getAllByText(/Debes aceptar los/i).length).not.toBeNull();
        });
    });

    it("muestra error si las contraseñas no coinciden", async () => {
        render(<RegisterForm />, { wrapper: MemoryRouter });

        fireEvent.input(screen.getAllByLabelText(/email/i)[0], {
            target: { value: "test@example.com" }
        });
        fireEvent.input(screen.getAllByLabelText(/nombre de usuario/i)[0], {
            target: { value: "usuario123" }
        });
        fireEvent.input(screen.getAllByLabelText(/^contraseña$/i)[0], {
            target: { value: "Password1!" }
        });
        fireEvent.input(screen.getAllByLabelText(/repite la contraseña/i)[0], {
            target: { value: "Password2!" }
        });
        fireEvent.click(screen.getAllByLabelText(/acepto los/i)[0]);
        fireEvent.click(screen.getAllByRole("button", { name: /registrarse/i })[0]);

        await waitFor(() => {
            expect(screen.getByText(/las contraseñas no coinciden/i)).not.toBeNull();
        });
    });

    it("envía los datos correctamente y redirige a la página para verificar el email", async () => {
        // Mock fetch
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ token: "fake-token" })
            })
        ) as any;

        render(<RegisterForm />, { wrapper: MemoryRouter });

        fireEvent.input(screen.getAllByLabelText(/email/i)[0], {
            target: { value: "test@example.com" }
        });
        fireEvent.input(screen.getAllByLabelText(/nombre de usuario/i)[0], {
            target: { value: "usuario123" }
        });
        fireEvent.input(screen.getAllByLabelText(/^contraseña$/i)[0], {
            target: { value: "Password1!" }
        });
        fireEvent.input(screen.getAllByLabelText(/repite la contraseña/i)[0], {
            target: { value: "Password1!" }
        });
        fireEvent.click(screen.getAllByLabelText(/acepto los/i)[0]);
        fireEvent.click(screen.getAllByRole("button", { name: /registrarse/i })[0]);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/verificar-email");
        });
    });

    it("muestra errores del backend", async () => {
        // Mock fetch
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    error: "Ya existe una cuenta con ese nombre de usuario.",
                    field: "username"
                })
            })
        ) as any;

        render(<RegisterForm />, { wrapper: MemoryRouter });

        fireEvent.input(screen.getAllByLabelText(/email/i)[0], {
            target: { value: "test@example.com" }
        });
        fireEvent.input(screen.getAllByLabelText(/nombre de usuario/i)[0], {
            target: { value: "usuario123" }
        });
        fireEvent.input(screen.getAllByLabelText(/^contraseña$/i)[0], {
            target: { value: "Password1!" }
        });
        fireEvent.input(screen.getAllByLabelText(/repite la contraseña/i)[0], {
            target: { value: "Password1!" }
        });
        fireEvent.click(screen.getAllByLabelText(/acepto los/i)[0]);
        fireEvent.click(screen.getAllByRole("button", { name: /registrarse/i })[0]);

        await waitFor(() => {
            expect(screen.getByText(/Ya existe una cuenta con ese nombre de usuario./i)).not.toBeNull();
        });
    });
});
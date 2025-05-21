/**
 * Tests for the <LoginForm /> component.
 * 
 * This file contains automated tests that verify the following behaviors:
 * - The login form renders all required fields and the submit button.
 * - Validation errors are shown when the form is incomplete.
 * - Backend errors (such as incorrect credentials) are displayed appropriately.
 * - Successful login triggers a redirect to the main page.
 * 
 * Mocks are used for navigation, fetch requests, ResizeObserver and window.matchMedia to isolate component logic.
 */
import { cleanup } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import LoginForm from "./login-form";

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

describe("LoginForm", () => {
    beforeEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it("renderiza el formulario de login", () => {
        render(<LoginForm />, { wrapper: MemoryRouter });

        expect(screen.getByLabelText(/email o nombre de usuario/i)).not.toBeNull();
        expect(screen.getByLabelText(/contraseña/i)).not.toBeNull();
        expect(screen.getByRole("button", { name: /entrar/i })).not.toBeNull();
    });

    it("muestra errores si el formulario está incompleto", async () => {
        render(<LoginForm />, { wrapper: MemoryRouter });

        fireEvent.click(screen.getByRole("button", { name: /entrar/i }));
        await waitFor(() => {
            expect(screen.getByText(/ingresa un email o nombre de usuario/i)).not.toBeNull();
            expect(screen.getByText(/ingresa una contraseña/i)).not.toBeNull();
        });
    });

    it("muestra error si las credenciales son incorrectas", async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ error: "Credenciales incorrectas" })
            })
        ) as any;

        render(<LoginForm />, { wrapper: MemoryRouter });

        fireEvent.input(screen.getByLabelText(/email o nombre de usuario/i), {
            target: { value: "usuario123" }
        });
        fireEvent.input(screen.getByLabelText(/contraseña/i), {
            target: { value: "Password1!" }
        });
        fireEvent.click(screen.getByRole("button", { name: /entrar/i }));
        await waitFor(() => {
            expect(screen.getByText(/credenciales incorrectas/i)).not.toBeNull();
        });
    });

    it("logea correctamente y redirige a la página principal", async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ token: "fake-token" })
            })
        ) as any;

        render(<LoginForm />, { wrapper: MemoryRouter });

        fireEvent.input(screen.getByLabelText(/email o nombre de usuario/i), {
            target: { value: "usuario123" }
        });
        fireEvent.input(screen.getByLabelText(/contraseña/i), {
            target: { value: "Password123!" }
        });
        fireEvent.click(screen.getByRole("button", { name: /entrar/i }));
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
    });
});
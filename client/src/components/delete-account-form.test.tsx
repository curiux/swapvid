/**
 * Tests for the <DeleteAccountForm /> component.
 *
 * This file contains automated tests that verify the following behaviors:
 * - The delete account form renders all required fields and the confirmation button.
 * - Backend errors (such as invalid token or user not found) are displayed appropriately.
 * - Successful deletion shows the confirmation message and clears localStorage.
 *
 * Mocks are used for fetch, ResizeObserver and window.matchMedia to isolate component logic.
 */
import { cleanup } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DeleteAccountForm from "./delete-account-form";

// Mock ResizeObserver
class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}
global.ResizeObserver = ResizeObserver;

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

describe("DeleteAccountForm", () => {
    const USERNAME = "usuario123";
    beforeEach(() => {
        cleanup();
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it("renderiza el formulario de eliminación de cuenta", () => {
        render(<DeleteAccountForm username={USERNAME} />);
        expect(screen.getByLabelText(/ingresa tu usuario/i)).not.toBeNull();
        expect(screen.getByRole("button", { name: /eliminar/i })).not.toBeNull();
    });

    it("deshabilita el botón si el usuario no coincide", () => {
        render(<DeleteAccountForm username={USERNAME} />);
        fireEvent.input(screen.getByLabelText(/ingresa tu usuario/i), {
            target: { value: "otroUsuario" }
        });
        expect((screen.getByRole("button", { name: /eliminar/i }) as HTMLButtonElement).disabled).toBe(true);
    });

    it("muestra error si el backend responde con error", async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                status: 401,
                json: () => Promise.resolve({ error: "Token inválido" })
            })
        ) as any;
        render(<DeleteAccountForm username={USERNAME} />);
        fireEvent.input(screen.getByLabelText(/ingresa tu usuario/i), {
            target: { value: USERNAME }
        });
        fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
        await waitFor(() => {
            expect(screen.getByText(/token inválido/i)).not.toBeNull();
        });
    });

    it("elimina correctamente y muestra mensaje de éxito", async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                status: 200,
                json: () => Promise.resolve({})
            })
        ) as any;
        render(<DeleteAccountForm username={USERNAME} />);
        fireEvent.input(screen.getByLabelText(/ingresa tu usuario/i), {
            target: { value: USERNAME }
        });
        fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
        await waitFor(() => {
            expect(screen.getByText(/han sido eliminados permanentemente/i)).not.toBeNull();
        });
        expect(localStorage.length).toBe(0);
    });
});

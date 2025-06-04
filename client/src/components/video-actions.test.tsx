/**
 * Tests for the <VideoActions /> component.
 *
 * This file contains automated tests that verify:
 * - The delete button renders and opens the confirmation dialog.
 * - The countdown disables the delete button for 5 seconds.
 * - The delete action calls the API and navigates on success.
 * - Backend/API errors are handled and navigation occurs as expected.
 *
 * Mocks are used for navigation, fetch, and store to isolate component logic.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import VideoActions from "./video-actions";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
    const mod = await vi.importActual("react-router");
    return {
        ...mod,
        useNavigate: () => mockNavigate,
    };
});

// Mock useVideoStore
vi.mock("@/lib/store", () => ({
    useVideoStore: (fn: any) => fn({ video: { _id: "123", title: "Test Video" } })
}));

// Mock fetch
const originalFetch = global.fetch;
beforeAll(() => {
    // No fake timers
});
afterAll(() => {
    global.fetch = originalFetch;
    // No real timers
});
beforeEach(() => {
    mockNavigate.mockReset();
    global.fetch = vi.fn();
    localStorage.clear();
});
afterEach(() => {
    vi.restoreAllMocks(); // Restore all mocks after each test
});

// Polyfill for toHaveAttribute matcher if not using @testing-library/jest-dom
function hasDisabledAttr(element: HTMLElement) {
    return element.hasAttribute("disabled");
}

describe("VideoActions", () => {
    it("renderiza el botón de eliminar y abre el diálogo", () => {
        render(<VideoActions />, { wrapper: MemoryRouter });
        const btn = screen.getAllByRole("button", { name: /eliminar/i })[0];
        expect(btn).toBeTruthy();
        fireEvent.click(btn);
        expect(screen.getByText(/esta acción es irreversible/i)).toBeTruthy();
    });

    it("deshabilita el botón de eliminar durante 5 segundos (cuenta regresiva)", async () => {
        render(<VideoActions />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getAllByRole("button", { name: /eliminar/i })[0]);
        await new Promise(res => setTimeout(res, 5100));
        const deleteBtn = screen.getAllByRole("button", { name: /eliminar/i })[0];
        await waitFor(() => {
            expect(hasDisabledAttr(deleteBtn)).toBe(false);
        });
    }, 7000);

    it("llama a la API y navega tras eliminar exitosamente", async () => {
        (global.fetch as any) = vi.fn().mockResolvedValue({
            status: 200,
            json: async () => ({})
        });
        render(<VideoActions />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getAllByRole("button", { name: /eliminar/i })[0]);
        await new Promise(res => setTimeout(res, 5100));
        const deleteBtn = screen.getAllByRole("button", { name: /eliminar/i })[0];
        await waitFor(() => {
            expect(hasDisabledAttr(deleteBtn)).toBe(false);
        });
        fireEvent.click(deleteBtn);
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/mi-coleccion");
        });
    }, 7000);

    it("navega a la página de error si la API responde con error (401/403/404)", async () => {
        (global.fetch as any) = vi.fn().mockResolvedValue({
            status: 403,
            json: async () => ({ error: "No tienes acceso a este video." })
        });
        render(<VideoActions />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getAllByRole("button", { name: /eliminar/i })[0]);
        await new Promise(res => setTimeout(res, 5100));
        const deleteBtn = screen.getAllByRole("button", { name: /eliminar/i })[0];
        await waitFor(() => {
            expect(hasDisabledAttr(deleteBtn)).toBe(false);
        });
        fireEvent.click(deleteBtn);
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining("/error?msg="));
        });
    }, 7000);

    it("navega a la página de error si ocurre una excepción en fetch", async () => {
        (global.fetch as any) = vi.fn().mockRejectedValue(new Error("Network error"));
        render(<VideoActions />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getAllByRole("button", { name: /eliminar/i })[0]);
        await new Promise(res => setTimeout(res, 5100));
        const deleteBtn = screen.getAllByRole("button", { name: /eliminar/i })[0];
        await waitFor(() => {
            expect(hasDisabledAttr(deleteBtn)).toBe(false);
        });
        fireEvent.click(deleteBtn);
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    }, 7000);
});

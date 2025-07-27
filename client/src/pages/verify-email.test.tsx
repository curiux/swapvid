/**
 * Tests for the <VerifyEmail /> page.
 *
 * This file contains automated tests that verify:
 * - Redirects if the user is already authenticated or email is missing.
 * - Renders the UI to resend the verification link.
 * - Sends the verification link and handles success and error messages.
 * - Verifies the token and navigates on success or error.
 *
 * Navigation, fetch, and toast functions are mocked to isolate component logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import VerifyEmail from "./verify-email";

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
vi.mock("sonner", () => {
    const toast = vi.fn();
    // @ts-ignore
    toast.success = vi.fn();
    return { toast, default: toast };
});


// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

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

beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    mockFetch.mockReset();
    mockNavigate.mockReset();
});

describe("VerifyEmail", () => {
    it("redirecciona si ya está autenticado o falta el email", () => {
        localStorage.setItem("token", "testtoken");
        render(<VerifyEmail />, { wrapper: MemoryRouter });
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("muestra la UI para reenviar enlace si no hay token en la URL", () => {
        localStorage.setItem("email", "test@example.com");
        render(<VerifyEmail />, { wrapper: MemoryRouter });
        expect(screen.getByText(/verifica tu correo/i)).toBeTruthy();
        expect(screen.getByRole("button", { name: /reenviar enlace/i })).toBeTruthy();
    });

    it("envía el enlace y muestra mensaje de éxito", async () => {
        localStorage.setItem("email", "test@example.com");
        mockFetch.mockResolvedValue({
            json: async () => ({}),
            status: 200
        });
        render(<VerifyEmail />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByRole("button", { name: /reenviar enlace/i }));
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/send-email-link"), expect.objectContaining({ method: "POST" }));
            expect(screen.getByText(/se ha enviado un correo/i)).toBeTruthy();
        });
    });

    it("muestra error si el reenvío de enlace falla", async () => {
        localStorage.setItem("email", "test@example.com");
        mockFetch.mockResolvedValue({
            json: async () => ({ error: "Error de backend" }),
            status: 400
        });
        render(<VerifyEmail />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByRole("button", { name: /reenviar enlace/i }));
        await waitFor(() => {
            expect(screen.getByText(/error de backend/i)).toBeTruthy();
        });
    });

    it("verifica el token y navega en caso de éxito", async () => {
        localStorage.setItem("email", "test@example.com");
        // Simulate token in URL
        const search = window.location.search;
        Object.defineProperty(window, "location", {
            value: { search: "?token=abc123" },
            writable: true
        });
        mockFetch.mockResolvedValue({
            json: async () => ({ token: "newtoken" }),
            status: 200
        });
        render(<VerifyEmail />, { wrapper: MemoryRouter });
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/verify-email"), expect.objectContaining({ method: "POST" }));
            expect(localStorage.getItem("token")).toBe("newtoken");
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
        window.location.search = search; // restore
    });

    it("navega a la página de error si la verificación del token falla", async () => {
        localStorage.setItem("email", "test@example.com");
        Object.defineProperty(window, "location", {
            value: { search: "?token=abc123" },
            writable: true
        });
        mockFetch.mockResolvedValue({
            json: async () => ({ error: "Token inválido" }),
            status: 400
        });
        render(<VerifyEmail />, { wrapper: MemoryRouter });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining("/error"));
        });
    });
});

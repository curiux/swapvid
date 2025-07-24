/**
 * Tests for the <EditUserDataForm /> component.
 *
 * This file contains automated tests that verify:
 * - The component renders fields and buttons.
 * - Validation errors are shown for invalid/missing fields.
 * - The form submits and calls the backend (mocked fetch).
 * - Handles authentication/session expiration and error states.
 * - Edit/cancel flow works as expected.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import EditUserDataForm from "./edit-userdata-form";
import { MemoryRouter } from "react-router";

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

const userData = {
    email: "juan@ejemplo.com",
    username: "juan123"
};

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

const getUserData = vi.fn();

beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    mockFetch.mockReset();
    mockNavigate.mockReset();
    getUserData.mockReset();
});

describe("EditUserDataForm", () => {
    it("renderiza los campos y el botón de editar", () => {
        render(<EditUserDataForm userData={userData} getUserData={getUserData} />, { wrapper: MemoryRouter });
        expect(screen.getByLabelText(/Email/i)).toBeTruthy();
        expect(screen.getByLabelText(/Nombre de usuario/i)).toBeTruthy();
        expect(screen.getByLabelText(/Contraseña/i)).toBeTruthy();
        expect(screen.getByRole("button", { name: /Editar datos/i })).toBeTruthy();
    });

    it("muestra errores de validación para email y usuario inválidos", async () => {
        render(<EditUserDataForm userData={userData} getUserData={getUserData} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByRole("button", { name: /Editar datos/i }));
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "bademail" } });
        fireEvent.change(screen.getByLabelText(/Nombre de usuario/i), { target: { value: "a" } });
        fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/i }));
        await waitFor(() => {
            expect(screen.getByText(/El email ingresado no es válido/i)).toBeTruthy();
            expect(screen.getByText(/solo puede contener letras/i)).toBeTruthy();
        });
    });

    it("muestra error si las contraseñas no coinciden", async () => {
        render(<EditUserDataForm userData={userData} getUserData={getUserData} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByRole("button", { name: /Editar datos/i }));
        fireEvent.change(screen.getAllByLabelText(/Contraseña/i)[0], { target: { value: "Password1!" } });
        fireEvent.change(screen.getByLabelText(/Repite la contraseña/i), { target: { value: "Password2!" } });
        fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/i }));
        await waitFor(() => {
            expect(screen.getByText(/Las contraseñas no coinciden/i)).toBeTruthy();
        });
    });

    it("envía el formulario y llama a fetch con los datos correctos", async () => {
        localStorage.setItem("token", "testtoken");
        const { toast } = await import("sonner");
        mockFetch.mockResolvedValue({
            json: async () => ({}),
            status: 200
        });
        render(<EditUserDataForm userData={userData} getUserData={getUserData} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByRole("button", { name: /Editar datos/i }));
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "nuevo@ejemplo.com" } });
        fireEvent.change(screen.getByLabelText(/Nombre de usuario/i), { target: { value: "nuevo123" } });
        fireEvent.change(screen.getAllByLabelText(/Contraseña/i)[0], { target: { value: "Password1!" } });
        fireEvent.change(screen.getByLabelText(/Repite la contraseña/i), { target: { value: "Password1!" } });
        fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/i }));
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/users/me"), expect.objectContaining({ method: "PATCH" }));
            expect(getUserData).toHaveBeenCalledWith("testtoken");
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("modificados"));
        });
    });

    it("redirecciona si la sesión expira (401/404)", async () => {
        localStorage.setItem("token", "testtoken");
        mockFetch.mockResolvedValue({
            json: async () => ({ error: "Sesión expirada" }),
            status: 401
        });
        render(<EditUserDataForm userData={userData} getUserData={getUserData} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByRole("button", { name: /Editar datos/i }));
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "nuevo@ejemplo.com" } });
        fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/i }));
        await waitFor(() => {
            expect(localStorage.getItem("token")).toBeNull();
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
    });

    it("muestra error si el backend retorna un error", async () => {
        localStorage.setItem("token", "testtoken");
        mockFetch.mockResolvedValue({
            json: async () => ({ error: "Error de backend" }),
            status: 400
        });
        render(<EditUserDataForm userData={userData} getUserData={getUserData} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByRole("button", { name: /Editar datos/i }));
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "nuevo@ejemplo.com" } });
        fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/i }));
        await waitFor(() => {
            expect(screen.getByText(/Error de backend/i)).toBeTruthy();
        });
    });

    it("permite cancelar la edición", async () => {
        render(<EditUserDataForm userData={userData} getUserData={getUserData} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByRole("button", { name: /Editar datos/i }));
        expect(screen.getByRole("button", { name: /Cancelar/i })).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }));
        expect(screen.getByRole("button", { name: /Editar datos/i })).toBeTruthy();
    });
});

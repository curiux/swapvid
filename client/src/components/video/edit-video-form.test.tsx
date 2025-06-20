/**
 * Tests for the <EditVideoForm /> component.
 *
 * This file contains automated tests that verify:
 * - The edit form renders all required fields and the submit/cancel buttons.
 * - Validation errors are shown when the form is incomplete or invalid.
 * - Successful form submission triggers a redirect.
 * - Backend errors are displayed appropriately to the user.
 *
 * Mocks are used for navigation, fetch, and window.matchMedia to isolate component logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import EditVideoForm from "./edit-video-form";
import { Dialog } from "../ui/dialog";
import { useVideoStore } from "@/lib/store";

// Mock useNavigate
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

// Mock ResizeObserver
class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}
global.ResizeObserver = ResizeObserver;

beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    // Reset video store
    useVideoStore.setState({ video: {
        _id: "123",
        title: "Título original",
        description: "Descripción original",
        category: "entretenimiento",
        keywords: ["original"],
        isSensitiveContent: false,
        uploadedDate: new Date(),
        thumbnail: "thumbnail.jpg",
        user: ""
    }});
});

describe("EditVideoForm", () => {
    it("renderiza el formulario de edición de video", () => {
        render(
            <Dialog>
                <EditVideoForm />
            </Dialog>,
            { wrapper: MemoryRouter }
        );
        expect(screen.getByLabelText(/título/i)).toBeTruthy();
        expect(screen.getByLabelText(/descripción/i)).toBeTruthy();
        expect(screen.getByLabelText(/categoría/i)).toBeTruthy();
        expect(screen.getByLabelText(/palabras clave/i)).toBeTruthy();
        expect(screen.getByLabelText(/contenido sensible/i)).toBeTruthy();
        expect(screen.getByRole("button", { name: /editar/i })).toBeTruthy();
    });

    it("muestra errores si el formulario está incompleto", async () => {
        render(
            <Dialog>
                <EditVideoForm />
            </Dialog>,
            { wrapper: MemoryRouter }
        );
        // Borrar título y descripción
        fireEvent.input(screen.getByLabelText(/título/i), { target: { value: "" } });
        fireEvent.input(screen.getByLabelText(/descripción/i), { target: { value: "" } });
        fireEvent.click(screen.getByRole("button", { name: /editar/i }));
        await waitFor(() => {
            expect(screen.getAllByText(/debe/i).length).toBeGreaterThan(0);
        });
    });

    it("envía los datos correctamente y redirige", async () => {
        // Mock fetch
        global.fetch = vi.fn().mockResolvedValue({
            status: 200,
            json: async () => ({})
        }) as any;
        localStorage.setItem("token", "fake-token");
        render(
            <Dialog>
                <EditVideoForm />
            </Dialog>,
            { wrapper: MemoryRouter }
        );
        // Cambiar título y descripción
        fireEvent.input(screen.getByLabelText(/título/i), { target: { value: "Nuevo título" } });
        fireEvent.input(screen.getByLabelText(/descripción/i), { target: { value: "Nueva descripción" } });
        fireEvent.click(screen.getByRole("button", { name: /editar/i }));
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled();
        });
    });

    it("muestra errores del backend", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            status: 400,
            json: async () => ({ error: "Error del backend" })
        }) as any;
        localStorage.setItem("token", "fake-token");
        render(
            <Dialog>
                <EditVideoForm />
            </Dialog>,
            { wrapper: MemoryRouter }
        );
        fireEvent.input(screen.getByLabelText(/título/i), { target: { value: "Nuevo título" } });
        fireEvent.click(screen.getByRole("button", { name: /editar/i }));
        await waitFor(() => {
            expect(screen.queryByText(/error del backend/i)).toBeTruthy();
        });
    });

    it("redirige si el backend responde 401 o 404", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            status: 401,
            json: async () => ({ error: "No autorizado" })
        }) as any;
        localStorage.setItem("token", "fake-token");
        render(
            <Dialog>
                <EditVideoForm />
            </Dialog>,
            { wrapper: MemoryRouter }
        );
        fireEvent.input(screen.getByLabelText(/título/i), { target: { value: "Nuevo título" } });
        fireEvent.click(screen.getByRole("button", { name: /editar/i }));
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled();
        });
    });
});

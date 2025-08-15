/**
 * Tests for the <VideoUploadForm /> component.
 *
 * This file contains automated tests that verify:
 * - The upload form renders all required fields and the submit button.
 * - Validation errors are shown when the form is incomplete or invalid.
 * - Successful form submission triggers a redirect to the account page.
 * - Backend errors are displayed appropriately to the user.
 *
 * Mocks are used for navigation, axios, and window.matchMedia to isolate component logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import VideoUploadForm from "./video-upload-form";

// Mock videojs (if used)
vi.mock("video.js", () => ({
    __esModule: true,
    default: vi.fn(() => ({ src: vi.fn(), dispose: vi.fn() }))
}));

// Mock calculateHash
vi.mock("@/lib/utils", async () => {
    const mod = await vi.importActual("@/lib/utils");
    return {
        ...mod,
        calculateHash: vi.fn(() => Promise.resolve("fake-hash"))
    };
});

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

// Mock URL.createObjectURL and URL.revokeObjectURL
beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => "mock-url");
    global.URL.revokeObjectURL = vi.fn();
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
});

// Mock Select to a native select for reliable testing
vi.mock("../ui/select", () => {
    return {
        Select: ({ onValueChange, children, ...props }: any) => (
            <select
                data-testid="category-select"
                id="category"
                onChange={e => onValueChange && onValueChange(e.target.value)}
                {...props}
            >
                <option value="">Selecciona una categoría</option>
                <option value="entertainment">Entretenimiento</option>
                <option value="education">Educación</option>
            </select>
        ),
        SelectContent: ({ children }: any) => <>{children}</>,
        SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
        SelectTrigger: ({ children }: any) => <>{children}</>,
        SelectValue: ({ placeholder }: any) => <option value="">{placeholder}</option>,
    };
});

describe("VideoUploadForm", () => {
    it("renderiza el formulario de subida de video", () => {
        render(<VideoUploadForm plan="basic" />, { wrapper: MemoryRouter });
        expect(screen.getByLabelText(/archivo de video/i)).toBeTruthy();
        expect(screen.getByLabelText(/título/i)).toBeTruthy();
        expect(screen.getByLabelText(/descripción/i)).toBeTruthy();
        expect(screen.getByLabelText(/categoría/i)).toBeTruthy();
        expect(screen.getByLabelText(/palabras clave/i)).toBeTruthy();
        expect(screen.getByLabelText(/contenido sensible/i)).toBeTruthy();
        expect(screen.getByRole("button", { name: /subir/i })).toBeTruthy();
    });

    it("muestra errores si el formulario está incompleto", async () => {
        render(<VideoUploadForm plan="basic" />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByRole("button", { name: /subir/i }));
        await waitFor(() => {
            expect(screen.getAllByText(/debe/i).length).toBeGreaterThan(1);
        });
    });

    it("muestra error si el archivo de video es inválido", async () => {
        render(<VideoUploadForm plan="basic" />, { wrapper: MemoryRouter });
        const fileInput = screen.getByLabelText(/archivo de video/i);
        const invalidFile = new File(["test"], "test.txt", { type: "text/plain" });
        fireEvent.change(fileInput, { target: { files: [invalidFile] } });
        fireEvent.click(screen.getByRole("button", { name: /subir/i }));
        await waitFor(() => {
            expect(screen.getByText(/formato no soportado/i)).toBeTruthy();
        });
    });

    it("envía los datos correctamente y redirige a la página de cuenta", async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                status: 201,
                json: () => Promise.resolve({
                    signature: "fake-signature",
                    timestamp: "1234567890",
                    cloudName: "fake-cloud",
                    apiKey: "fake-api-key",
                    publicId: "fake-public-id"
                }),
            } as any)
        );

        // Mock axios
        const axios = await import("axios");
        (axios.default.post as any) = vi.fn().mockResolvedValue({});
        localStorage.setItem("token", "fake-token");

        render(<VideoUploadForm plan="basic" />, { wrapper: MemoryRouter });
        // Fill fields
        fireEvent.change(screen.getByLabelText(/archivo de video/i), {
            target: {
                files: [new File(["video"], "video.mp4", { type: "video/mp4" })]
            }
        });
        fireEvent.input(screen.getByLabelText(/título/i), { target: { value: "Video de prueba" } });
        fireEvent.input(screen.getByLabelText(/descripción/i), { target: { value: "Descripción de prueba para video." } });
        // Select category (reliable native select mock)
        fireEvent.change(screen.getByTestId("category-select"), { target: { value: "entertainment" } });
        // Add keywords (simulate TagInput)
        const keywordInput = screen.getByLabelText(/palabras clave/i);
        fireEvent.change(keywordInput, { target: { value: "test" } });
        fireEvent.keyDown(keywordInput, { key: "Enter", code: "Enter" });
        fireEvent.click(screen.getByRole("button", { name: /subir/i }));
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/mi-coleccion");
        });
    });

    it("muestra errores del backend", async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                status: 400,
                json: () => Promise.resolve({ error: "Error del backend" }),
            } as any)
        );

        localStorage.setItem("token", "fake-token");
        render(<VideoUploadForm plan="basic" />, { wrapper: MemoryRouter });
        fireEvent.change(screen.getByLabelText(/archivo de video/i), {
            target: {
                files: [new File(["video"], "video.mp4", { type: "video/mp4" })]
            }
        });
        fireEvent.input(screen.getByLabelText(/título/i), { target: { value: "Video de prueba" } });
        fireEvent.input(screen.getByLabelText(/descripción/i), { target: { value: "Descripción de prueba para video." } });
        // Select category (reliable native select mock)
        fireEvent.change(screen.getByTestId("category-select"), { target: { value: "entertainment" } });
        // Add keywords (simulate TagInput)
        const keywordInput = screen.getByLabelText(/palabras clave/i);
        fireEvent.change(keywordInput, { target: { value: "test" } });
        fireEvent.keyDown(keywordInput, { key: "Enter", code: "Enter" });
        fireEvent.click(screen.getByRole("button", { name: /subir/i }));
        await waitFor(() => {
            expect(screen.queryByText(/error del backend/i)).toBeTruthy();
        });
    });
});

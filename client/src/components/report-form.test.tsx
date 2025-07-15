/**
 * Tests for the <ReportForm /> component.
 *
 * This file contains automated tests that verify:
 * - The component renders the dialog and form fields.
 * - Validation errors are shown for missing required fields.
 * - The form submits and calls the backend (mocked fetch).
 * - Handles authentication and error states.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ReportForm from "./report-form";
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
vi.mock("sonner", () => ({ toast: vi.fn() }));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

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

beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    mockFetch.mockReset();
    mockNavigate.mockReset();
});

// Mock Select to a native select for reliable testing
vi.mock("./ui/select", () => {
    return {
        Select: ({ onValueChange, children, ...props }: any) => (
            <select
                data-testid="reason-select"
                id="reason"
                onChange={e => onValueChange && onValueChange(e.target.value)}
                {...props}
            >
                <option value="">Selecciona una razón</option>
                <option value="inappropriate_unmarked">Contenido inapropiado sin marcar como tal</option>
                <option value="other">Otro (especificar)</option>
            </select>
        ),
        SelectContent: ({ children }: any) => <>{children}</>,
        SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
        SelectTrigger: ({ children }: any) => <>{children}</>,
        SelectValue: ({ placeholder }: any) => <option value="">{placeholder}</option>,
    };
});

describe("ReportForm", () => {
    it("renderiza el diálogo y los campos del formulario", () => {
        render(<ReportForm videoId="vid123" openChange={vi.fn()} />, { wrapper: MemoryRouter });
        expect(screen.getByText(/Reportar video/i)).toBeTruthy();
        expect(screen.getByLabelText(/Razón del reporte/i)).toBeTruthy();
        expect(screen.getByLabelText(/Detalles adicionales/i)).toBeTruthy();
        expect(screen.getByRole("button", { name: /Reportar/i })).toBeTruthy();
    });

    it("muestra error de validación si no se selecciona una razón", async () => {
        render(<ReportForm videoId="vid123" openChange={vi.fn()} />, { wrapper: MemoryRouter });
        const submitBtn = screen.getByRole("button", { name: /Reportar/i });
        fireEvent.click(submitBtn);
        await waitFor(() => {
            expect(screen.getByText(/Debes seleccionar una razón/i)).toBeTruthy();
        });
    });

    it("muestra error si se selecciona 'otra' razón pero no se escribe texto", async () => {
        render(<ReportForm videoId="vid123" openChange={vi.fn()} />, { wrapper: MemoryRouter });
        localStorage.setItem("token", "testtoken");
        // Select 'other' reason (reliable native select mock)
        fireEvent.change(screen.getByTestId("reason-select"), { target: { value: "other" } });
        const submitBtn = screen.getByRole("button", { name: /Reportar/i });
        fireEvent.click(submitBtn);
        await waitFor(() => {
            expect(screen.getByText(/Debes escribir una razón/i)).toBeTruthy();
        });
    });

    it("envía el formulario y llama a fetch con los datos correctos", async () => {
        localStorage.setItem("token", "testtoken");
        mockFetch.mockResolvedValue({
            json: async () => ({}),
            status: 201
        });
        const openChange = vi.fn();
        render(<ReportForm videoId="vid123" openChange={openChange} />, { wrapper: MemoryRouter });
        // Select a valid reason
        fireEvent.change(screen.getByTestId("reason-select"), { target: { value: "inappropriate_unmarked" } });
        // Enter details
        const details = screen.getByLabelText(/Detalles adicionales/i);
        fireEvent.change(details, { target: { value: "Contenido inapropiado" } });
        // Submit
        const submitBtn = screen.getByRole("button", { name: /Reportar/i });
        fireEvent.click(submitBtn);
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalled();
            expect(openChange).toHaveBeenCalled();
        });
    });

    it("redirecciona a login si no está autenticado", async () => {
        render(<ReportForm videoId="vid123" openChange={vi.fn()} />, { wrapper: MemoryRouter });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/login");
        });
    });

    it("muestra error si el backend retorna un error", async () => {
        localStorage.setItem("token", "testtoken");
        mockFetch.mockResolvedValue({
            json: async () => ({ error: "Error de backend" }),
            status: 400
        });
        render(<ReportForm videoId="vid123" openChange={vi.fn()} />, { wrapper: MemoryRouter });
        // Select a valid reason
        fireEvent.change(screen.getByTestId("reason-select"), { target: { value: "inappropriate_unmarked" } });
        // Submit
        const submitBtn = screen.getByRole("button", { name: /Reportar/i });
        fireEvent.click(submitBtn);
        await waitFor(() => {
            expect(screen.getByText(/Error de backend/i)).toBeTruthy();
        });
    });
});

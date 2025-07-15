/**
 * Tests for the <SearchInput /> component.
 *
 * This file contains automated tests that verify:
 * - The component renders the input and button.
 * - The component navigates to the correct URL on Enter key or button click.
 * - The filters dialog appears and works when enabled.
 *
 * Mocks are used for navigation and window.matchMedia to isolate component logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import SearchInput from "./search-input";

// Mock Select to a native select for reliable testing
vi.mock("./ui/select", () => {
  return {
    Select: ({ onValueChange, children, ...props }: any) => (
      <select
        data-testid="category-select"
        id="category"
        onChange={e => onValueChange && onValueChange(e.target.value)}
        {...props}
      >
        <option value="">Selecciona una categoría</option>
        <option value="all">(Todas)</option>
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
});

describe("SearchInput", () => {
    it("renderiza el input y el botón", () => {
        render(<SearchInput filters={false} />, { wrapper: MemoryRouter });
        expect(screen.getByRole("searchbox")).toBeTruthy();
        expect(screen.getByTestId("searchbtn")).toBeTruthy();
    });

    it("navega a /buscar?q=<query> al presionar Enter", () => {
        render(<SearchInput filters={false} />, { wrapper: MemoryRouter });
        const input = screen.getByRole("searchbox");
        fireEvent.change(input, { target: { value: "test" } });
        fireEvent.keyDown(input, { key: "Enter" });
        expect(mockNavigate).toHaveBeenCalledWith("/buscar?q=test");
    });

    it("navega a /buscar?q=<query> al hacer click en el botón", () => {
        render(<SearchInput filters={false} />, { wrapper: MemoryRouter });
        const input = screen.getByRole("searchbox");
        fireEvent.change(input, { target: { value: "video" } });
        const button = screen.getByTestId("searchbtn");
        fireEvent.click(button);
        // Button uses Link, so navigation is handled by router, but we can check the href
        expect(button.getAttribute("href")).toBe("/buscar?q=video");
    });

    it("muestra el diálogo de filtros cuando el prop filters es true", async () => {
        render(<SearchInput filters={true} />, { wrapper: MemoryRouter });
        const filterBtn = screen.getAllByRole("button")[0];
        fireEvent.click(filterBtn);
        await waitFor(() => {
            expect(screen.getByText(/Filtrar búsqueda/i)).toBeTruthy();
        });
    });

    it("aplica los filtros y navega", async () => {
        render(<SearchInput filters={true} />, { wrapper: MemoryRouter });
        const filterBtn = screen.getAllByRole("button")[0];
        fireEvent.click(filterBtn);
        await waitFor(() => {
            expect(screen.getByText(/Filtrar búsqueda/i)).toBeTruthy();
        });
        // Select category using native select mock
        fireEvent.change(screen.getAllByTestId("category-select")[0], { target: { value: "all" } });
        // Select order (simulate with same approach if needed)
        // If you mock the order select, use getByTestId and change as above
        // Sensitive content checkbox
        const sensitiveCheckbox = screen.getByLabelText(/Incluir contenido sensible/i);
        fireEvent.click(sensitiveCheckbox);
        // Submit
        const submitBtn = screen.getByText("Filtrar");
        fireEvent.click(submitBtn);
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled();
        });
    });
});

/**
 * Tests for the <ExchangeVideoList /> component.
 *
 * This file contains automated tests that verify:
 * - The user's video list is fetched and displayed correctly.
 * - Navigation occurs correctly on backend or network errors.
 * - Video selection and exchange dialog behavior work as expected, including dialog closing after exchange.
 *
 * Mocks are used for navigation, fetch, and window.matchMedia to isolate component logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import ExchangeVideoList from "./exchange-video-list";

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
    vi.restoreAllMocks();
    localStorage.clear();
    mockNavigate.mockReset();
});

describe("ExchangeVideoList", () => {
    it("muestra la lista de videos del usuario", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ videos: [
                {
                    _id: "v1",
                    title: "Video 1",
                    description: "desc",
                    category: "cat",
                    keywords: [],
                    isSensitiveContent: false,
                    uploadedDate: new Date().toISOString(),
                    thumbnail: "thumb1.jpg",
                    user: "u1"
                },
                {
                    _id: "v2",
                    title: "Video 2",
                    description: "desc2",
                    category: "cat2",
                    keywords: [],
                    isSensitiveContent: false,
                    uploadedDate: new Date().toISOString(),
                    thumbnail: "thumb2.jpg",
                    user: "u1"
                }
            ] })
        }) as any;
        render(
            <MemoryRouter>
                <ExchangeVideoList userId="u1" exchange={vi.fn()} />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText(/video 1/i)).toBeTruthy();
            expect(screen.getByText(/video 2/i)).toBeTruthy();
        });
    });

    it("navega a la raíz si el backend responde 401 o 404", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            status: 401,
            json: async () => ({ error: "No autorizado" })
        }) as any;
        render(
            <MemoryRouter>
                <ExchangeVideoList userId="u1" exchange={vi.fn()} />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
    });

    it("navega a la página de error si hay otro error del backend", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            status: 500,
            json: async () => ({ error: "Error del backend" })
        }) as any;
        render(
            <MemoryRouter>
                <ExchangeVideoList userId="u1" exchange={vi.fn()} />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining("/error?msg="));
        });
    });

    it("navega a la página de error si falla la petición fetch", async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
        render(
            <MemoryRouter>
                <ExchangeVideoList userId="u1" exchange={vi.fn()} />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });

    it("permite seleccionar un video y abrir el diálogo de intercambio", async () => {
        const mockExchange = vi.fn();
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ videos: [
                {
                    _id: "v1",
                    title: "Video 1",
                    description: "desc",
                    category: "cat",
                    keywords: [],
                    isSensitiveContent: false,
                    uploadedDate: new Date().toISOString(),
                    thumbnail: "thumb1.jpg",
                    user: "u1"
                }
            ] })
        }) as any;
        render(
            <MemoryRouter>
                <ExchangeVideoList userId="u1" exchange={mockExchange} />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText(/video 1/i)).toBeTruthy();
        });
        fireEvent.click(screen.getAllByLabelText(/seleccionar video/i)[0]);
        fireEvent.click(screen.getAllByTestId("chevron-trigger")[0]);
        await waitFor(() => {
            expect(screen.getAllByText(/intercambio/i)[0]).toBeTruthy();
        });
        fireEvent.click(screen.getByRole("button", { name: /intercambiar/i }));
        await waitFor(() => {
            expect(screen.queryByText(/intercambio/i)).toBeNull();
        });
    });
});

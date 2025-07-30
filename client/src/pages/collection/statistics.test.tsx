/**
 * Tests for the <Statistics /> page.
 *
 * This file contains automated tests that verify:
 * - The page renders the total views and exchanges correctly.
 * - The loading spinner is displayed while fetching data.
 * - Error handling and navigation to the error page work as expected.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Statistics from "./statistics";

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

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();
    mockFetch.mockReset();
});

describe("Statistics", () => {
    it("muestra el spinner de carga mientras se obtienen los datos", () => {
        mockFetch.mockResolvedValueOnce(new Promise(() => {})); // Never resolves

        render(
            <MemoryRouter>
                <Statistics />
            </MemoryRouter>
        );

        expect(screen.getByTestId("loading")).toBeTruthy();
    });

    it("renderiza las vistas y los intercambios totales correctamente", async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({
                totalViews: 1000,
                totalExchanges: 50,
                exchangeCounts: { pending: 10, accepted: 30, rejected: 10 },
                topVideos: [],
                videos: []
            }),
        });
        localStorage.setItem("token", "fake-token");

        render(
            <MemoryRouter>
                <Statistics />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/vistas de videos totales/i)).toBeTruthy();
            expect(screen.getByText(/1,000/i)).toBeTruthy();
            expect(screen.getByText(/50/i)).toBeTruthy();
        });
    });

    it("navega a la página de error en caso de fallo en la obtención de datos", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Network error"));
        localStorage.setItem("token", "fake-token");

        render(
            <MemoryRouter>
                <Statistics />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });
});
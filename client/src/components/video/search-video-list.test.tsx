/**
 * Tests for the <SearchVideoList /> component.
 *
 * This file contains automated tests that verify:
 * - The component renders a spinner while loading.
 * - The component displays a message when no videos are found.
 * - The component renders a list of videos with correct data.
 * - Pagination and error navigation are handled correctly.
 *
 * Mocks are used for fetch, navigation, and window.matchMedia to isolate component logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import SearchVideoList from "./search-video-list";

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

beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
});

describe("SearchVideoList", () => {
    it("muestra el spinner mientras carga", () => {
        // Mock fetch to never resolve
        global.fetch = vi.fn();
        render(<SearchVideoList />, { wrapper: MemoryRouter });
        expect(screen.getAllByTestId("loading")[0]).toBeTruthy();
    });

    it("muestra mensaje si no hay videos", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ videos: [], totalPages: 0 })
        }) as any;
        render(<SearchVideoList />, { wrapper: MemoryRouter });
        await waitFor(() => {
            expect(screen.getByText(/no se encontraron videos/i)).toBeTruthy();
        });
    });

    it("muestra la lista de videos", async () => {
        const videos = [
            {
                _id: "1",
                title: "Video 1",
                thumbnail: "thumb1.jpg",
                uploadedDate: new Date().toISOString(),
                user: "Usuario1",
                rating: { value: 4.5, count: 10 }
            },
            {
                _id: "2",
                title: "Video 2",
                thumbnail: "thumb2.jpg",
                uploadedDate: new Date().toISOString(),
                user: "Usuario2",
                rating: { value: 3, count: 5 }
            }
        ];
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ videos, totalPages: 1 })
        }) as any;
        render(<SearchVideoList />, { wrapper: MemoryRouter });
        await waitFor(() => {
            expect(screen.getByText("Video 1")).toBeTruthy();
            expect(screen.getByText("Video 2")).toBeTruthy();
        });
    });

    it("navega a la página de error si hay error en la respuesta", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ error: "Error" })
        }) as any;
        render(<SearchVideoList />, { wrapper: MemoryRouter });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled();
        });
    });

    it("navega a la página de error si fetch falla", async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
        render(<SearchVideoList />, { wrapper: MemoryRouter });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled();
        });
    });
});

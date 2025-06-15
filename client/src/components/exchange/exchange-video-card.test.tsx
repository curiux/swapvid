/**
 * Tests for the <ExchangeVideoCard /> component.
 *
 * This file contains automated tests that verify:
 * - The card fetches and displays video data correctly.
 * - Navigation is triggered on backend error or fetch failure.
 * - Backend errors are handled and navigation occurs as expected.
 *
 * Mocks are used for navigation, fetch, and window.matchMedia to isolate component logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import ExchangeVideoCard from "./exchange-video-card";

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

describe("ExchangeVideoCard", () => {
    it("obtiene y muestra los datos del video", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ data: {
                _id: "vid123",
                title: "Test Video",
                description: "A test video.",
                category: "test",
                keywords: ["test"],
                isSensitiveContent: false,
                uploadedDate: new Date().toISOString(),
                thumbnail: "thumb.jpg",
                user: "user1"
            } })
        }) as any;
        render(
            <MemoryRouter>
                <ExchangeVideoCard videoId="vid123" />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText(/test video/i)).toBeTruthy();
        });
    });

    it("navega a la página de error si hay un error del backend", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ error: "Backend error" })
        }) as any;
        render(
            <MemoryRouter>
                <ExchangeVideoCard videoId="vid123" />
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
                <ExchangeVideoCard videoId="vid123" />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });
});

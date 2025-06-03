/**
 * Tests for the <VideoLibrary /> component.
 *
 * This file contains automated tests that verify:
 * - The library renders the user's videos as cards.
 * - Redirects to / if no token is present.
 * - Handles API errors (401/404: redirects to /, other errors: redirects to /error?msg=...).
 * - Handles fetch exceptions (redirects to /error).
 *
 * Mocks are used for navigation, fetch, and localStorage to isolate component logic.
 */
import { beforeEach, describe, expect, it, vi, afterAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import VideoLibrary from "./video-library";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
    const mod = await vi.importActual("react-router");
    return {
        ...mod,
        useNavigate: () => mockNavigate,
    };
});

const sampleVideos = [
    {
        _id: "1",
        title: "Video 1",
        thumbnail: "thumb1.jpg",
        uploadedDate: new Date().toISOString(),
    },
    {
        _id: "2",
        title: "Video 2",
        thumbnail: "thumb2.jpg",
        uploadedDate: new Date().toISOString(),
    },
];

const originalFetch = global.fetch;
beforeEach(() => {
    mockNavigate.mockReset();
    global.fetch = vi.fn();
    localStorage.clear();
});
afterAll(() => {
    global.fetch = originalFetch;
});

describe("VideoLibrary", () => {
    it("redirige a / si no hay token", () => {
        render(<VideoLibrary />, { wrapper: MemoryRouter });
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("muestra los videos del usuario", async () => {
        localStorage.setItem("token", "fake-token");
        (global.fetch as any) = vi.fn().mockResolvedValue({
            status: 200,
            json: async () => ({ videos: sampleVideos })
        });
        render(<VideoLibrary />, { wrapper: MemoryRouter });
        await waitFor(() => {
            expect(screen.getByText("Video 1")).toBeTruthy();
            expect(screen.getByText("Video 2")).toBeTruthy();
        });
        expect(screen.getAllByRole("link").length).toBe(2);
    });

    it("redirige a / si la API responde 401 o 404", async () => {
        localStorage.setItem("token", "fake-token");
        (global.fetch as any) = vi.fn().mockResolvedValue({
            status: 401,
            json: async () => ({ error: "Unauthorized" })
        });
        render(<VideoLibrary />, { wrapper: MemoryRouter });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
    });

    it("redirige a /error?msg=... si la API responde con otro error", async () => {
        localStorage.setItem("token", "fake-token");
        (global.fetch as any) = vi.fn().mockResolvedValue({
            status: 500,
            json: async () => ({ error: "Server error" })
        });
        render(<VideoLibrary />, { wrapper: MemoryRouter });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining("/error?msg="));
        });
    });

    it("redirige a /error si ocurre una excepción en fetch", async () => {
        localStorage.setItem("token", "fake-token");
        (global.fetch as any) = vi.fn().mockRejectedValue(new Error("Network error"));
        render(<VideoLibrary />, { wrapper: MemoryRouter });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });
});

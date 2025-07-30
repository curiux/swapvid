/**
 * Tests for the <VideoListStats /> component.
 *
 * This file contains automated tests that verify:
 * - The component renders the title and video list correctly.
 * - The component displays statistics for a selected video.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import VideoListStats from "./video-list-stats";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
    const mod = await vi.importActual("react-router");
    return {
        ...mod,
        useNavigate: () => mockNavigate,
    };
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();
    mockFetch.mockReset();
});

describe("VideoListStats", () => {
    const mockVideos = [
        { _id: "v1", title: "Video 1", views: 100, exchangesCount: 10, thumbnail: "thumb1.jpg" },
        { _id: "v2", title: "Video 2", views: 200, exchangesCount: 20, thumbnail: "thumb2.jpg" },
    ];

    it("renderiza el título y la lista de videos correctamente", () => {
        render(
            <MemoryRouter>
                <VideoListStats
                    statName="Views"
                    topVideos={mockVideos}
                    videos={mockVideos}
                    statsType="views"
                />
            </MemoryRouter>
        );

        expect(screen.getByText(/Views por video/i)).toBeTruthy();
        expect(screen.getByText(/Video 1/i)).toBeTruthy();
        expect(screen.getByText(/Video 2/i)).toBeTruthy();
    });

    it("muestra las estadísticas de un video seleccionado", async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ data: { _id: "v1", title: "Video 1", views: 100, exchangesCount: 10 } }),
        });

        render(
            <MemoryRouter>
                <VideoListStats
                    statName="Views"
                    topVideos={[]}
                    videos={mockVideos}
                    statsType="views"
                />
            </MemoryRouter>
        );

        fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "v1" } });

        await waitFor(() => {
            expect(screen.getByText(/Video 1/i)).toBeTruthy();
            expect(screen.getByText(/100/i)).toBeTruthy();
        });
    });
});
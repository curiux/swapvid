/**
 * Tests for the <ExchangeRatingForm /> component.
 *
 * This file contains automated tests that verify:
 * - The component fetches and displays the rating form and handles loading state.
 * - Navigation occurs on missing token or backend/fetch errors.
 * - Submits a rating and handles backend responses.
 *
 * Mocks are used for navigation, fetch, and window.matchMedia to isolate component logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import ExchangeRatingForm from "./exchange-rating-form";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
    const mod = await vi.importActual("react-router");
    return {
        ...mod,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: "ex1" })
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

describe("ExchangeRatingForm", () => {
    it("navega a '/' si no hay token", () => {
        render(
            <MemoryRouter>
                <ExchangeRatingForm />
            </MemoryRouter>
        );
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("muestra el spinner de carga inicialmente", () => {
        localStorage.setItem("token", "tok123");
        global.fetch = vi.fn(() => new Promise(() => {})) as any; // never resolves
        render(
            <MemoryRouter>
                <ExchangeRatingForm />
            </MemoryRouter>
        );
        expect(screen.getAllByTestId("loading")[0]).toBeTruthy();
    });

    it("muestra el formulario de calificación correctamente", async () => {
        localStorage.setItem("token", "tok123");
        global.fetch = vi.fn().mockResolvedValue({
            status: 200,
            json: async () => ({ data: {
                _id: "ex1",
                user: "initiator",
                responder: "userB",
                initiator: "userA",
                status: "accepted",
                hasRated: false,
                responderVideo: "vid1",
                initiatorVideo: "vid2"
            } })
        }) as any;
        render(
            <MemoryRouter>
                <ExchangeRatingForm />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText(/calificación/i)).toBeTruthy();
            expect(screen.getByRole("button", { name: /calificar/i })).toBeTruthy();
        });
    });

    it("maneja error del backend y navega a error", async () => {
        localStorage.setItem("token", "tok123");
        global.fetch = vi.fn().mockResolvedValue({
            status: 400,
            json: async () => ({ error: "Backend error" })
        }) as any;
        render(
            <MemoryRouter>
                <ExchangeRatingForm />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining("/error?msg="));
        });
    });

    it("maneja error de fetch y navega a /error", async () => {
        localStorage.setItem("token", "tok123");
        global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
        render(
            <MemoryRouter>
                <ExchangeRatingForm />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });

    it("envía la calificación y navega correctamente", async () => {
        localStorage.setItem("token", "tok123");
        // First fetch: get exchange data
        global.fetch = vi.fn()
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({ data: {
                    _id: "ex1",
                    user: "initiator",
                    responder: "userB",
                    initiator: "userA",
                    status: "accepted",
                    hasRated: false,
                    responderVideo: "vid1",
                    initiatorVideo: "vid2"
                } })
            })
            // Second fetch: submit rating
            .mockResolvedValueOnce({
                status: 201,
                json: async () => ({})
            });
        render(
            <MemoryRouter>
                <ExchangeRatingForm />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText(/calificación/i)).toBeTruthy();
        });
        // Simulate submit
        fireEvent.click(screen.getAllByRole("button", { name: /calificar/i })[0]);
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled();
        });
    });
});

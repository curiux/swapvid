/**
 * Tests for the <ExchangeList /> component.
 *
 * This file contains automated tests that verify:
 * - The component fetches and displays a list of exchanges.
 * - Loading and error states are handled correctly.
 * - Navigation occurs on missing token or backend/fetch errors.
 *
 * Mocks are used for navigation, fetch, and window.matchMedia to isolate component logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import ExchangeList from "./exchange-list";

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

describe("ExchangeList", () => {
    it("navega a '/' si no hay token", () => {
        render(
            <MemoryRouter>
                <ExchangeList />
            </MemoryRouter>
        );
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("muestra el spinner de carga inicialmente", () => {
        localStorage.setItem("token", "tok123");
        global.fetch = vi.fn(() => new Promise(() => {})) as any; // never resolves
        render(
            <MemoryRouter>
                <ExchangeList />
            </MemoryRouter>
        );
        expect(screen.getAllByTestId("loading")[0]).toBeTruthy();
    });

    it("muestra la lista de intercambios correctamente", async () => {
        localStorage.setItem("token", "tok123");
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ exchanges: [
                {
                    _id: "ex1",
                    user: "initiator",
                    responder: "userB",
                    initiator: "userA",
                    status: "pending",
                    requestedDate: new Date().toISOString(),
                    initiatorVideoUrl: "thumb1.jpg",
                    responderVideoUrl: "thumb2.jpg"
                }
            ] })
        }) as any;
        render(
            <MemoryRouter>
                <ExchangeList />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText(/intercambio con/i)).toBeTruthy();
            expect(screen.getByAltText(/video del iniciador/i)).toBeTruthy();
            expect(screen.getByAltText(/video del receptor/i)).toBeTruthy();
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
                <ExchangeList />
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
                <ExchangeList />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });
});

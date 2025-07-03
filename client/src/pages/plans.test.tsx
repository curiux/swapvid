/**
 * Tests for the <Plans /> page component.
 *
 * This file contains automated tests that verify:
 * - The loading spinner is shown while fetching plans.
 * - Plans are rendered with correct names, descriptions, and prices.
 * - Features and plan details are displayed as expected.
 * - The subscription dialog opens when clicking the button.
 * - Navigates to error page if the API returns an error response.
 * - Navigates to error page if fetch throws an exception.
 *
 * Mocks are used for navigation and fetch to isolate component logic.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Plans, { preloadedPlans } from "./plans";

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
const originalFetch = global.fetch;
beforeAll(() => {});
afterAll(() => {
    global.fetch = originalFetch;
});
beforeEach(() => {
    mockNavigate.mockReset();
    global.fetch = vi.fn();
});
afterEach(() => {
    vi.restoreAllMocks();
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

describe("Plans", () => {
    const plansApi = [
        {
            _id: "1",
            name: "basic",
            monthlyPrice: 0,
            libraryStorage: 104857600,
            librarySize: 10,
            videoMaxSize: 52428800,
            exchangeLimit: 2
        },
        {
            _id: "2",
            name: "advanced",
            monthlyPrice: 5,
            libraryStorage: 1073741824,
            librarySize: 50,
            videoMaxSize: 209715200,
            exchangeLimit: 10
        },
        {
            _id: "3",
            name: "premium",
            monthlyPrice: 10,
            libraryStorage: 0,
            librarySize: 0,
            videoMaxSize: 0,
            exchangeLimit: 0
        }
    ];

    it("muestra el spinner de carga inicialmente", () => {
        (global.fetch as any) = vi.fn(() => new Promise(() => {}));
        render(<Plans />, { wrapper: MemoryRouter });
        expect(screen.getByTestId("loading")).toBeTruthy();
    });

    it("renderiza todos los planes con nombres, descripciones y precios correctos", async () => {
        (global.fetch as any) = vi.fn().mockResolvedValue({
            json: async () => ({ plans: plansApi })
        });
        render(<Plans />, { wrapper: MemoryRouter });
        for (const plan of plansApi) {
            const preload = preloadedPlans.find(p => p.name === plan.name)!;
            await waitFor(() => {
                expect(screen.getByText(preload.nameShown)).toBeTruthy();
                expect(screen.getByText(preload.description)).toBeTruthy();
            });
            if (plan.name === "basic") {
                expect(screen.getByText(/gratis/i)).toBeTruthy();
            } else {
                expect(screen.getByText(new RegExp(`UYU\\s*${plan.monthlyPrice}`))).toBeTruthy();
                expect(screen.getAllByRole("button", { name: /elegir este plan/i })[0]).toBeTruthy();
            }
        }
    });

    it("muestra las características y detalles de los planes", async () => {
        (global.fetch as any) = vi.fn().mockResolvedValue({
            json: async () => ({ plans: plansApi })
        });
        render(<Plans />, { wrapper: MemoryRouter });
        await waitFor(() => {
            expect(screen.getAllByText(/almacenamiento en biblioteca/i)[0]).toBeTruthy();
            expect(screen.getAllByText(/cantidad de videos máxima/i)[0]).toBeTruthy();
            expect(screen.getAllByText(/tamaño máximo de cada video/i)[0]).toBeTruthy();
            expect(screen.getAllByText(/límite de intercambios/i)[0]).toBeTruthy();
        });
        // Premium plan features
        for (const feature of preloadedPlans.find(p => p.name === "premium")!.features) {
            expect(screen.getAllByText(feature)[0]).toBeTruthy();
        }
    });

    it("abre el diálogo de suscripción al hacer clic en el botón", async () => {
        (global.fetch as any) = vi.fn().mockResolvedValue({
            json: async () => ({ plans: plansApi })
        });
        render(<Plans />, { wrapper: MemoryRouter });
        await waitFor(() => {
            expect(screen.getAllByRole("button", { name: /elegir este plan/i })[0]).toBeTruthy();
        });
        fireEvent.click(screen.getAllByRole("button", { name: /elegir este plan/i })[0]);
        expect(screen.getByRole("dialog")).toBeTruthy();
    });

    it("navega a la página de error si la API retorna error", async () => {
        (global.fetch as any) = vi.fn().mockResolvedValue({
            json: async () => ({ error: "API error" })
        });
        render(<Plans />, { wrapper: MemoryRouter });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining("/error?msg="));
        });
    });

    it("navega a la página de error si fetch lanza excepción", async () => {
        (global.fetch as any) = vi.fn().mockRejectedValue(new Error("Network error"));
        render(<Plans />, { wrapper: MemoryRouter });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });
});

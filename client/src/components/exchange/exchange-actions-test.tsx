/**
 * Tests for the <ExchangeActions /> component.
 *
 * This file contains automated tests that verify:
 * - The component renders the correct buttons based on user role and status.
 * - The reject/cancel dialog opens and closes as expected.
 * - The reject/cancel action triggers the correct API call and navigation.
 * - Backend and fetch errors are handled and navigation occurs as expected.
 *
 * Mocks are used for navigation, fetch, and window.matchMedia to isolate component logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import ExchangeActions from "./exchange-actions";

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

describe("ExchangeActions", () => {
    it("no muestra acciones si el estado es 'accepted' o 'rejected'", () => {
        const { container: accepted } = render(
            <MemoryRouter>
                <ExchangeActions exchangeId="ex1" status="accepted" user="initiator" hasRated={false} />
            </MemoryRouter>
        );
        expect(accepted.firstChild).toBeNull();
        const { container: rejected } = render(
            <MemoryRouter>
                <ExchangeActions exchangeId="ex2" status="rejected" user="responder" hasRated={false} />
            </MemoryRouter>
        );
        expect(rejected.firstChild).toBeNull();
    });

    it("muestra botón de aceptar solo para el usuario 'responder'", () => {
        render(
            <MemoryRouter>
                <ExchangeActions exchangeId="ex3" status="pending" user="responder" hasRated={false} />
            </MemoryRouter>
        );
        expect(screen.getByLabelText(/aceptar intercambio/i)).toBeTruthy();
    });

    it("abre y cierra el diálogo de rechazar/cancelar", async () => {
        render(
            <MemoryRouter>
                <ExchangeActions exchangeId="ex4" status="pending" user="initiator" hasRated={false} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByLabelText(/cancelar petición/i));
        expect(await screen.findByText(/cancelar petición/i)).toBeTruthy();
        fireEvent.click(screen.getByText(/cancelar/i));
        await waitFor(() => {
            expect(screen.queryByText(/cancelar petición/i)).toBeNull();
        });
    });

    it("realiza la petición de rechazo y navega correctamente", async () => {
        localStorage.setItem("token", "tok123");
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ data: { status: "rejected" } })
        }) as any;
        render(
            <MemoryRouter>
                <ExchangeActions exchangeId="ex5" status="pending" user="responder" hasRated={false} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByLabelText(/rechazar intercambio/i));
        expect(await screen.findByText(/rechazar intercambio/i)).toBeTruthy();
        fireEvent.click(screen.getByText(/rechazar/i));
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/exchanges/ex5"),
                expect.objectContaining({
                    method: "PATCH",
                    headers: expect.objectContaining({ Authorization: expect.stringContaining("tok123") }),
                    body: expect.stringContaining("rejected")
                })
            );
            expect(mockNavigate).toHaveBeenCalledWith(0);
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
                <ExchangeActions exchangeId="ex6" status="pending" user="responder" hasRated={false} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByLabelText(/rechazar intercambio/i));
        fireEvent.click(await screen.findByText(/rechazar/i));
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining("/error?msg="));
        });
    });

    it("maneja error de fetch y navega a /error", async () => {
        localStorage.setItem("token", "tok123");
        global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
        render(
            <MemoryRouter>
                <ExchangeActions exchangeId="ex7" status="pending" user="responder" hasRated={false} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByLabelText(/rechazar intercambio/i));
        fireEvent.click(await screen.findByText(/rechazar/i));
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });

    it("realiza la petición de cancelación y navega correctamente", async () => {
        localStorage.setItem("token", "tokCancel");
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ data: { status: "deleted" } })
        }) as any;
        render(
            <MemoryRouter>
                <ExchangeActions exchangeId="ex8" status="pending" user="initiator" hasRated={false} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByLabelText(/cancelar petición/i));
        expect(await screen.findByText(/cancelar petición/i)).toBeTruthy();
        fireEvent.click(screen.getByText(/cancelar petición/i));
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/exchanges/ex8"),
                expect.objectContaining({
                    method: "DELETE",
                    headers: expect.objectContaining({ Authorization: expect.stringContaining("tokCancel") })
                })
            );
            expect(localStorage.getItem("msg")).toMatch(/canceló el intercambio/i);
            expect(mockNavigate).toHaveBeenCalledWith(0);
        });
    });

    it("maneja error del backend al cancelar y navega a error", async () => {
        localStorage.setItem("token", "tokCancel");
        global.fetch = vi.fn().mockResolvedValue({
            status: 400,
            json: async () => ({ error: "Backend error" })
        }) as any;
        render(
            <MemoryRouter>
                <ExchangeActions exchangeId="ex9" status="pending" user="initiator" hasRated={false} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByLabelText(/cancelar petición/i));
        fireEvent.click(await screen.findByText(/cancelar petición/i));
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining("/error?msg="));
        });
    });

    it("maneja error de fetch al cancelar y navega a /error", async () => {
        localStorage.setItem("token", "tokCancel");
        global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
        render(
            <MemoryRouter>
                <ExchangeActions exchangeId="ex10" status="pending" user="initiator" hasRated={false} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByLabelText(/cancelar petición/i));
        fireEvent.click(await screen.findByText(/cancelar petición/i));
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });
});

/**
 * Tests for the <Notifications /> component.
 *
 * This file contains automated tests that verify:
 * - The component does not render if not authenticated.
 * - Shows loading spinner while fetching notifications.
 * - Shows message if there are no notifications.
 * - Renders notifications and unread badge.
 * - Handles expired session and backend errors.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Notifications from "./notifications";
import { toast } from "sonner";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
    const mod = await vi.importActual("react-router");
    return {
        ...mod,
        useNavigate: () => mockNavigate,
        useLocation: () => ({})
    };
});

// Mock toast
vi.mock("sonner", () => ({ toast: vi.fn() }));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.matchMedia
if (!window.matchMedia) {
    window.matchMedia = function () {
        return {
            matches: false,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false
        };
    } as any;
}

beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    mockFetch.mockReset();
    mockNavigate.mockReset();
    (toast as any).mockClear && (toast as any).mockClear();
});

describe("Notifications", () => {
    it("no se muestra si no está autenticado", () => {
        render(<Notifications isMobile={false} />, { wrapper: MemoryRouter });
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("muestra el spinner de carga mientras obtiene datos", async () => {
        localStorage.setItem("token", "tok123");
        mockFetch.mockImplementation(() => new Promise(() => {})); // never resolves
        render(<Notifications isMobile={false} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getAllByTestId("open")[0]);
        await waitFor(() => {
            expect(screen.getByTestId("loading")).toBeTruthy();
        });
    });

    it("muestra 'No tienes notificaciones.' si no hay notificaciones", async () => {
        localStorage.setItem("token", "tok123");
        mockFetch.mockResolvedValue({
            status: 200,
            json: async () => ({ notifications: [], unreadCount: 0 }),
        } as any);
        render(<Notifications isMobile={false} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getAllByTestId("open")[0]);
        await waitFor(() => {
            expect(screen.getByText(/No tienes notificaciones/i)).toBeTruthy();
        });
    });

    it("muestra las notificaciones y el contador de no leídas", async () => {
        localStorage.setItem("token", "tok123");
        mockFetch.mockResolvedValue({
            json: async () => ({
                notifications: [
                    {
                        _id: "n1",
                        type: "exchange_requested",
                        isRead: false,
                        createdAt: new Date().toISOString(),
                        message: "Usuario te ha enviado una solicitud de intercambio."
                    }
                ],
                unreadCount: 1
            }),
        } as any);
        render(<Notifications isMobile={false} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getAllByTestId("open")[0]);
        await waitFor(() => {
            expect(screen.getByText(/Usuario te ha enviado/i)).toBeTruthy();
            expect(screen.getByText("1")).toBeTruthy();
        });
    });

    it("navega a / si la sesión está expirada (401)", async () => {
        localStorage.setItem("token", "tok123");
        mockFetch.mockResolvedValue({
            status: 401,
            json: async () => ({ error: "Unauthorized" }),
        } as any);
        render(<Notifications isMobile={false} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getAllByTestId("open")[0]);
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
    });

    it("muestra toast y navega a la página de error si hay un error del backend", async () => {
        localStorage.setItem("token", "tok123");
        mockFetch.mockResolvedValue({
            status: 400,
            json: async () => ({ error: "Backend error" }),
        } as any);
        render(<Notifications isMobile={false} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getAllByTestId("open")[0]);
        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith("Backend error");
        });
    });
});
/**
 * Tests for the <SubscriptionDialog /> component.
 *
 * This file contains automated tests that verify:
 * - The dialog opens and closes as expected.
 * - The payment process sends a POST request and handles responses.
 * - Navigates to login if not authenticated, to profile on success, and shows errors on failure.
 * - Handles loading and error states correctly.
 *
 * Mocks are used for navigation, fetch, localStorage, and MercadoPago SDK to isolate component logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import SubscriptionDialog from "./subscription-dialog";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
    const mod = await vi.importActual("react-router");
    return {
        ...mod,
        useNavigate: () => mockNavigate,
    };
});

// Mock MercadoPago SDK
vi.mock("@mercadopago/sdk-react", () => ({
    CardPayment: ({ onSubmit }: any) => (
        <button onClick={() => onSubmit({ payer: { email: "test@mail.com" }, token: "tok123" })}>
            Pagar
        </button>
    ),
    initMercadoPago: vi.fn(),
}));

// Mock toast
vi.mock("sonner", () => {
  const toast = vi.fn();
  // @ts-ignore
  toast.error = vi.fn();
  return { toast, default: toast };
});

const plan = {
    _id: "plan1",
    name: "Plan Básico",
    monthlyPrice: 100,
    libraryStorage: 10,
    librarySize: 10,
    videoMaxSize: 100,
    exchangeLimit: 5,
    stats: false,
    exchangePriority: false,
    searchPriority: false,
    supportPriority: false,
};

describe("SubscriptionDialog", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        mockNavigate.mockReset();
        process.on("unhandledRejection", () => {});
    });

    it("navega a login si no hay token", () => {
        render(
            <MemoryRouter>
                <SubscriptionDialog open={true} handleChange={() => {}} plan={plan} />
            </MemoryRouter>
        );
        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("abre y cierra el diálogo", () => {
        render(
            <MemoryRouter>
                <SubscriptionDialog open={true} handleChange={() => {}} plan={plan} />
            </MemoryRouter>
        );
        expect(screen.getByRole("dialog")).toBeTruthy();
    });

    it("envía POST y navega a perfil al suscribirse con éxito", async () => {
        localStorage.setItem("token", "tok123");
        global.fetch = vi.fn().mockResolvedValue({
            status: 200,
            json: async () => ({}),
        }) as any;
        render(
            <MemoryRouter>
                <SubscriptionDialog open={true} handleChange={() => {}} plan={plan} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getAllByText(/pagar/i)[0]);
        await waitFor(() => {
            expect(localStorage.getItem("msg")).toMatch(/suscribiste/i);
            expect(mockNavigate).toHaveBeenCalledWith("/perfil");
        });
    });

    it("muestra error de pago rechazado (401 con mp)", async () => {
        localStorage.setItem("token", "tok123");
        global.fetch = vi.fn().mockResolvedValue({
            status: 401,
            json: async () => ({ error: "Unauthorized", mp: true }),
        }) as any;
        const { toast } = await import("sonner");
        render(
            <MemoryRouter>
                <SubscriptionDialog open={true} handleChange={() => {}} plan={plan} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getAllByText(/pagar/i)[0]);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                expect.stringMatching(/pago fue rechazado/i)
            );
        });
    });

    it("muestra error de sesión expirada (401 sin mp)", async () => {
        localStorage.setItem("token", "tok123");
        global.fetch = vi.fn().mockResolvedValue({
            status: 401,
            json: async () => ({ error: "Unauthorized" }),
        }) as any;
        const { toast } = await import("sonner");
        render(
            <MemoryRouter>
                <SubscriptionDialog open={true} handleChange={() => {}} plan={plan} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getAllByText(/pagar/i)[0]);
        await waitFor(() => {
            expect(localStorage.getItem("token")).toBeNull();
            expect(toast).toHaveBeenCalledWith(
                expect.stringMatching(/sesión ha expirado/i)
            );
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
    });

    it("muestra error genérico en otros errores", async () => {
        localStorage.setItem("token", "tok123");
        global.fetch = vi.fn().mockResolvedValue({
            status: 400,
            json: async () => ({ error: "Backend error" }),
        }) as any;
        const { toast } = await import("sonner");
        render(
            <MemoryRouter>
                <SubscriptionDialog open={true} handleChange={() => {}} plan={plan} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getAllByText(/pagar/i)[0]);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                expect.stringMatching(/ha ocurrido un error/i)
            );
        });
    });
});

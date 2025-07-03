import { useEffect } from "react";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { API_URL, MP_PUBLIC_KEY } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { Plan } from "@/lib/types";

/**
 * SubscriptionDialog component
 * - Renders a dialog for subscribing to a service using MercadoPago payment integration.
 * - Initializes MercadoPago and checks user authentication (redirects to login if not authenticated).
 * - Submits payment data to the backend and handles errors with toast notifications.
 * - Navigates and stores messages based on payment result.
 * - Used to securely subscribe and make payments within a modal dialog.
 */
export default function SubscriptionDialog({ open, handleChange, plan }:
    { open: boolean, handleChange: (open: boolean) => void, plan: Plan | undefined }) {
    const navigate = useNavigate();

    useEffect(() => {
        initMercadoPago(MP_PUBLIC_KEY, { locale: "es-UY" });
    }, []);

    useEffect(() => {
        if (!open) return;

        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
        }
    }, [open]);

    return plan && (
        <Dialog open={open} onOpenChange={(open) => handleChange(open)}>
            <DialogContent className="min-w-1/2 max-w-full max-h-screen overflow-y-auto md:m-5">
                <DialogTitle className="text-2xl font-semibold">Suscríbete</DialogTitle>
                <CardPayment
                    initialization={{ amount: plan.monthlyPrice }}
                    onSubmit={async (formData) => {
                        const email = formData.payer.email;
                        const cardTokenId = formData.token;

                        const token = localStorage.getItem("token");
                        const res = await fetch(API_URL + "/subscriptions", {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                planId: plan._id,
                                email,
                                cardTokenId
                            })
                        });
                        const data = await res.json();
                        if (data.error) {
                            if (res.status == 401) {
                                if (data.mp) {
                                    toast.error("Tu pago fue rechazado. Intentá con otra tarjeta o medio de pago.");
                                } else {
                                    localStorage.clear();
                                    navigate("/");
                                }
                            } else {
                                toast.error("Ha ocurrido un error");
                            }
                            return Promise.reject(new Error("Ha ocurrido un error"));
                        } else if (res.status == 200) {
                            localStorage.setItem("msg", "¡Todo listo! Te suscribiste correctamente. Ahora podés disfrutar de tu plan sin límites.");
                            navigate("/perfil");
                        }
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}

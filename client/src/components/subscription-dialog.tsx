import { useEffect } from "react";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { API_URL, MP_PUBLIC_KEY } from "@/lib/utils";
import { Dialog, DialogContent } from "./ui/dialog";
import { useNavigate } from "react-router";
import { Toaster } from "./ui/sonner";
import { toast } from "sonner";

/**
 * SubscriptionDialog component
 * - Renders a dialog for subscribing to a service using MercadoPago payment integration.
 * - Handles MercadoPago initialization and user authentication (redirects to login if not authenticated).
 * - Submits payment data to the backend and displays error messages using toast notifications.
 * - Used to allow users to subscribe and make payments securely within a modal dialog.
 */
export default function SubscriptionDialog({ open, handleChange }: { open: boolean, handleChange: (open: boolean) => void }) {
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

    return (
        <Dialog open={open} onOpenChange={(open) => handleChange(open)}>
            <DialogContent className="min-w-1/2 max-w-full max-h-screen overflow-y-auto md:m-5">
                <Toaster />
                <h2 className="text-2xl font-semibold">Suscríbete</h2>
                <CardPayment
                    initialization={{ amount: 100 }}
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
                                email,
                                cardTokenId
                            })
                        });
                        const data = await res.json();
                        if (data.error) {
                            if (res.status == 401) {
                                localStorage.clear();
                                navigate("/");
                            } else {
                                toast.error("Ha ocurrido un error");
                            }
                        } else {
                            console.log(data);
                        }
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}

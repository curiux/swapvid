import { API_URL } from "@/lib/utils";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useState } from "react";
import { useNavigate } from "react-router";

/**
 * CancelSubscriptionDialog component
 * - Renders a dialog for users to cancel their subscription.
 * - Handles the cancellation process by sending a PUT request to the backend.
 * - Manages authentication (redirects to login if not authenticated or subscription not found).
 * - Displays appropriate messages and navigates based on the result of the cancellation.
 * - Used to allow users to securely cancel their subscription within a modal dialog.
 */
export default function CancelSubscriptionDialog() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleCancel = async () => {
        setOpen(false);

        const token = localStorage.getItem("token");

        try {
            const res = await fetch(API_URL + "/subscriptions", {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.error) {
                if (res.status == 401 || res.status == 404) {
                    localStorage.clear();
                    navigate("/");
                } else {
                    navigate("/error?msg=" + encodeURIComponent(data.error));
                }
            } else {
                localStorage.setItem("msg", "Se canceló la subscripción");
                navigate(0);
            }
        } catch (e) {
            navigate("/error");
        }
    }

    return (
        <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
            <DialogTrigger asChild>
                <Button variant="link" className="text-red-400 cursor-pointer p-0 pl-1">Cancelar</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cancelar subscripción</DialogTitle>
                    <DialogDescription>
                        Estás seguro de que quieres cancelar tu subscripción? Seguirás contando con los beneficios del plan hasta el final del período facturado.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" aria-label="Volver">Volver</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleCancel}>
                        Cancelar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
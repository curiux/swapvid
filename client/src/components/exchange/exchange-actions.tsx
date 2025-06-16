import { Link, useNavigate } from "react-router";
import { Button } from "../ui/button";
import { Check, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { useState } from "react";
import { API_URL } from "@/lib/utils";

/**
 * ExchangeActions component
 * Provides UI and logic for accepting or rejecting an exchange request.
 * Props:
 * - exchangeId: string representing the exchange to act upon.
 * - status: current status of the exchange (e.g., pending, accepted, rejected).
 * - user: role of the user (e.g., initiator or responder).
 */
export default function ExchangeActions({ exchangeId, status, user }: { exchangeId: string, status: string, user: string }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    if (status == "accepted" || status == "rejected") {
        return;
    }

    const handleCancel = () => {
        setOpen(false);
    }

    const handleReject = async () => {
        setOpen(false);

        const token = localStorage.getItem("token");

        try {
            const res = await fetch(API_URL + "/exchanges/" + exchangeId, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: "rejected"
                })
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
                localStorage.setItem("msg", "Se rechazó el intercambio");
                navigate(0);
            }
        } catch (e) {
            navigate("/error");
        }
    }

    return (
        <div className="flex gap-2">
            {user != "initiator" && (
                <Button
                    asChild
                    className="text-primary bg-green-300 hover:bg-green-400 dark:text-primary-foreground"
                    aria-label="Aceptar intercambio">
                    <Link to={"/mi-coleccion/intercambios/" + exchangeId}>
                        <Check />
                    </Link>
                </Button>
            )}
            <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
                <DialogTrigger asChild>
                    <Button
                        className="cursor-pointer text-primary bg-red-400 hover:bg-red-500 dark:text-primary-foreground"
                        aria-label={user == "initiator" ? "Cancelar petición" : "Rechazar intercambio"}>
                        <X />
                    </Button>
                </DialogTrigger>
                <DialogContent className="min-w-1/2 max-w-full max-h-screen overflow-y-auto sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{user == "initiator" ? "Cancelar Petición" : "Rechazar intercambio"}</DialogTitle>
                        <DialogDescription>
                            Estás seguro de que quieres {user == "initiator" ? "cancelar esta petición" : "rechazar este intercambio"}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" aria-label="Cancelar">Cancelar</Button>
                        </DialogClose>
                        <Button onClick={() => user == "initiator" ? handleCancel() : handleReject()}>
                            {user == "initiator" ? "Cancelar petición" : "Rechazar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
import { Link, useNavigate } from "react-router";
import { Button } from "../ui/button";
import { Check, Star, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { useState } from "react";
import { API_URL } from "@/lib/utils";
import { toast } from "sonner";
import ReportBtn from "../video/report-btn";

/**
 * ExchangeActions component
 * Provides UI and logic for accepting, rejecting, or canceling an exchange request, and for rating after acceptance.
 *
 * Props:
 * - exchangeId: string representing the exchange to act upon.
 * - status: current status of the exchange (e.g., pending, accepted, rejected).
 * - user: role of the user (e.g., initiator or responder).
 * - hasRated: boolean indicating if the user has already rated the exchange.
 */
export default function ExchangeActions({ exchangeId, status, user, hasRated }:
    { exchangeId: string, status: string, user: string, hasRated: boolean }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    if (status == "rejected") return;

    if (status == "accepted") {
        return (
            <div className="flex gap-2">
                {hasRated ? (
                    <Button
                        asChild
                        variant="outline"
                        aria-label="Calificar">
                        <Link to={"/mi-coleccion/intercambios/calificar/" + exchangeId}>
                            <Star />
                            <span>Calificado</span>
                        </Link>
                    </Button>
                ) : (
                    <Button
                        asChild
                        aria-label="Calificar">
                        <Link to={"/mi-coleccion/intercambios/calificar/" + exchangeId}>
                            <Star />
                            <span>Calificar</span>
                        </Link>
                    </Button>
                )}
                <ReportBtn exchangeId={exchangeId} />
            </div>
        );
    }

    const handleCancel = async () => {
        setOpen(false);

        const token = localStorage.getItem("token");

        try {
            const res = await fetch(API_URL + "/exchanges/" + exchangeId, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.error) {
                if (res.status == 401 || res.status == 404) {
                    localStorage.clear();
                    toast("Tu sesión ha expirado.")
                    navigate("/");
                } else {
                    navigate("/error?msg=" + encodeURIComponent(data.error));
                }
            } else {
                localStorage.setItem("msg", "Se canceló el intercambio");
                navigate(0);
            }
        } catch (e) {
            navigate("/error");
        }
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
                    toast("Tu sesión ha expirado.")
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
import { Info, Repeat, SquarePen, Trash, X } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useEffect, useState } from "react";
import { useVideoStore } from "@/lib/store";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { API_URL } from "@/lib/utils";
import type { Video } from "@/lib/types";

/**
 * VideoActions component
 * - Renders action buttons for a video depending on ownership.
 * - If the user is the owner, shows edit and delete options.
 * - If not the owner, shows the exchange option.
 * - Uses Outlet for nested routes.
 */
export default function VideoActions() {
    const location = useLocation();
    const videoData = useVideoStore(state => state.video);

    if (!videoData) return;

    if (videoData?.isOwner) {
        return (
            <div className="flex item-center gap-3">
                <Button
                    asChild
                    className="cursor-pointer"
                    aria-label="Editar video"
                >
                    <Link to={location.pathname + "/editar"}>
                        <SquarePen />
                    </Link>
                </Button>
                <Outlet />
                <DeleteAction videoData={videoData} />
            </div>
        );
    }

    return (
        <div className="flex item-center gap-3">
            <ExchangeAction videoData={videoData} />
        </div>
    );
}

/**
 * DeleteAction component
 * - Shows a dialog to confirm video deletion
 * - Implements a 5-second countdown before enabling delete
 * - Handles API call to delete the video
 * - Navigates on success or error
 */
function DeleteAction({ videoData }: { videoData: Video }) {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(0);
    const [disabled, setDisabled] = useState(true);
    const [open, setOpen] = useState(false);

    const handleOpenChange = (open: boolean) => {
        setOpen(open);
        if (open) {
            setDisabled(true);
            setCountdown(5);
        }
    }

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);

            return () => clearTimeout(timer);
        }

        if (countdown === 0 && disabled) {
            setDisabled(false);
        }
    }, [countdown]);

    const handleDelete = async () => {
        const token = localStorage.getItem("token");
        setOpen(false);

        try {
            const res = await fetch(API_URL + "/videos/" + videoData?._id, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (res.status == 200) {
                localStorage.setItem("msg", "Tu video ha sido eliminado");
                navigate("/mi-coleccion");
            } else if (data.error) {
                if (res.status == 401 || res.status == 403 || res.status == 404) {
                    navigate("/error?msg=" + encodeURIComponent(data.error));
                } else {
                    throw new Error();
                }
            }
        } catch (e) {
            navigate("/error");
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="cursor-pointer"
                    aria-label="Eliminar video"
                >
                    <Trash />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-destructive">Eliminar video</DialogTitle>
                    <DialogDescription>
                        Estás seguro de que quieres eliminar este video? Esta acción es irreversible.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" aria-label="Cancelar">Cancelar</Button>
                    </DialogClose>
                    <Button variant="destructive" disabled={disabled} onClick={handleDelete}>
                        Eliminar{disabled ? ` (${countdown})` : ""}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * ExchangeAction component
 * - Handles the UI and logic for requesting a video exchange with another user.
 * - If the current user has already requested an exchange for this video, displays the request status and a cancel button (cancel logic not implemented).
 * - If not requested, provides a dialog to confirm the exchange action, including a warning about losing access to the video if the exchange is accepted.
 * - On confirmation, sends a POST request to the backend to initiate the exchange and updates the store state accordingly.
 * - Handles navigation on error or authentication issues.
 */
function ExchangeAction({ videoData }: { videoData: Video }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const update = useVideoStore(state => state.update);

    const handleRequest = async () => {
        sendRequest();
        setOpen(false);
    }

    const sendRequest = async () => {
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(API_URL + "/exchanges/request", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: videoData.user,
                    videoId: videoData._id
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
            } else if (res.status == 201) {
                update({ ...videoData, hasRequested: true });
            }
        } catch (e) {
            navigate("/error");
        }
    }

    if (videoData?.hasRequested) {
        return (
            <div>
                <Button className="bg-green-300 hover:bg-green-300 rounded-r-none text-primary dark:text-secondary" aria-label="Intercambiar">
                    <Repeat />
                    <span>Pedido</span>
                </Button>
                <Button className="rounded-l-none cursor-pointer text-primary bg-red-500 hover:bg-red-700 dark:text-secondary">
                    <X />
                </Button>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
            <DialogTrigger asChild>
                <Button className="cursor-pointer" aria-label="Intercambiar">
                    <Repeat />
                    <span>Intercambiar</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl">¡Intercambialo!</DialogTitle>
                    <DialogDescription className="flex flex-col items-center gap-2 md:flex-row">
                        <Info />
                        Recuerda que al realizar esta acción perderás acceso al video de tu biblioteca elegido por el otro usuario,
                        en caso de que acepte el intercambio.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" aria-label="Cancelar">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleRequest}>
                        Pedir intercambio
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
import { SquarePen, Trash } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useEffect, useState } from "react";
import { useVideoStore } from "@/lib/store";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { API_URL } from "@/lib/utils";

/**
 * VideoActions component
 * - Provides edit and delete actions for a video.
 * - Edit action navigates to the edit page for the current video.
 * - Delete action opens a confirmation dialog and handles video deletion with a countdown.
 * - Uses Outlet for nested routes.
 */
export default function VideoActions() {
    const location = useLocation();

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
            <DeleteAction />
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
function DeleteAction() {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(0);
    const [disabled, setDisabled] = useState(true);
    const [open, setOpen] = useState(false);
    const videoData = useVideoStore(state => state.video);

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
                navigate("/cuenta");
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
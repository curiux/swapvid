import EditVideoForm from "@/components/video/edit-video-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/utils";
import Spinner from "@/components/spinner";
import { toast } from "sonner";

/**
 * EditVideo page component
 * - Shows a dialog for editing video information using EditVideoForm.
 * - Checks for a valid user token and fetches user subscription data.
 * - Redirects to home if not authenticated, or to error page on fetch error.
 * - Navigates back to the video page when the dialog is closed.
 */
export default function EditVideo() {
    const navigate = useNavigate();
    const location = useLocation();
    const [plan, setPlan] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        } else {
            getUserData(token);
        }
    }, []);

    const getUserData = async (token: String) => {
        try {
            const res = await fetch(API_URL + "/users/me", {
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
                setPlan(data.subscription.plan);
                setLoading(false);
            }
        } catch (e) {
            navigate("/error");
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            navigate(location.pathname.split("/editar")[0]);
        }
    }

    return (
        <Dialog defaultOpen={true} onOpenChange={handleOpenChange}>
            <DialogContent className="min-w-1/2 max-w-full max-h-screen overflow-y-auto sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Editar video</DialogTitle>
                    <DialogDescription>
                        Edita la información de tu video
                    </DialogDescription>
                </DialogHeader>
                {loading ? (
                    <div className="w-full flex justify-center">
                        <Spinner className="w-14 h-14" />
                    </div>
                ) : (
                    <EditVideoForm plan={plan as any} />
                )}
            </DialogContent>
        </Dialog>
    );
}
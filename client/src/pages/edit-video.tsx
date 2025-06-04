import EditVideoForm from "@/components/edit-video-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation, useNavigate } from "react-router";

/**
 * EditVideo page component
 * - Renders a dialog for editing video information.
 * - Navigates back to the video page when the dialog is closed.
 * - Uses EditVideoForm for the form UI and logic.
 */
export default function EditVideo() {
    const navigate = useNavigate();
    const location = useLocation();
    
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
                <EditVideoForm />
            </DialogContent>
        </Dialog>
    );
}
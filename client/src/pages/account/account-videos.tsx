import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { FileVideo } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

/**
 * Renders the user's video library page.
 * Shows a button to upload a new video, which navigates to the upload page.
 * Displays a toast notification if a message is present in localStorage.
 */
export default function AccountVideos() {
    useEffect(() => {
        const msg = localStorage.getItem("msg");
        if (msg) {
            toast.success(msg);
            localStorage.removeItem("msg");
        }
    }, []);

    return (
        <div className="p-5">
            <Toaster position="top-center" />
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold">Biblioteca de videos</h1>
                <Button asChild size="lg" aria-label="Subir video">
                    <Link to="/cuenta/subir">
                        <FileVideo />
                        Subir video
                    </Link>
                </Button>
            </div>
        </div>
    );
}
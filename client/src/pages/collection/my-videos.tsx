import { Button } from "@/components/ui/button";
import VideoLibrary from "@/components/video/video-library";
import { FileVideo } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

/**
 * Renders the user's video library page.
 * - Displays a button to upload a new video, navigating to the upload page.
 * - Shows a toast notification if a message is present in localStorage, then removes it.
 * - Renders the VideoLibrary component to display the user's videos.
 */
export default function MyVideos() {
    useEffect(() => {
        const msg = localStorage.getItem("msg");
        if (msg) {
            setTimeout(() => {
                toast.success(msg);
                localStorage.removeItem("msg");
            }, 50);
        }
    }, []);

    return (
        <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h1 className="text-2xl font-semibold">Biblioteca de videos</h1>
                <Button asChild size="lg" aria-label="Subir video">
                    <Link to="/mi-coleccion/subir">
                        <FileVideo />
                        Subir video
                    </Link>
                </Button>
            </div>
            <VideoLibrary />
        </div>
    );
}
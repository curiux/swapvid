import { Button } from "@/components/ui/button";
import { FileVideo } from "lucide-react";
import { Link } from "react-router";

/**
 * This component renders the user's video library page.
 * It displays a button to upload a new video, which navigates to the upload page.
 */
export default function AccountVideos() {
    return (
        <div className="p-5">
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
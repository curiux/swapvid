import VideoUploadForm from "@/components/video/video-upload-form";
import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * This component renders the video upload page.
 * It checks for authentication and displays the video upload form.
 */
export default function VideoUpload() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token)
            navigate("/");
    }, []);

    return (
        <div className="flex w-full items-center p-3">
            <div className="w-full max-w-4xl">
                <VideoUploadForm />
            </div>
        </div>
    );
}
import VideoActions from "@/components/video/video-actions";
import VideoPlayer from "@/components/video/video-player";
import { useVideoStore } from "@/lib/store";
import { API_URL, timeAgo, videoCategories } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import type { Video as VideoType } from "@/lib/types";
import Spinner from "@/components/spinner";
import { Separator } from "@/components/ui/separator";
import VideoPreview from "@/components/video/video-preview";
import { toast } from "sonner";

/**
 * Video page component
 * - Fetches and displays a single video's details, including player or preview, title, description, category, keywords, and actions.
 * - Handles authentication, error, and not-found redirects based on API responses.
 * - Updates global video store state and manages session expiration.
 * - Shows video info, keywords, and owner-specific actions (edit, delete, exchange).
 */
export default function Video() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const [videoData, setVideoData] = useState<VideoType>();
    const update = useVideoStore(state => state.update);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (params.id && !location.pathname.includes("edit")) {
            getVideoData(token);
        }
    }, [location]);

    const getVideoData = async (token: string | null) => {
        try {
            let res;
            if (token) {
                res = await fetch(API_URL + "/videos/" + params.id, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
            } else {
                res = await fetch(API_URL + "/videos/" + params.id);
            }

            const data = await res.json();
            if (data.error) {
                if (res.status == 404 && data.type == "user") {
                    localStorage.clear();
                    toast("Tu sesión ha expirado.")
                    navigate("/");
                } else if (res.status == 400 || (res.status == 404 && data.type == "video")) {
                    navigate("/404");
                } else {
                    navigate("/error?msg=" + encodeURIComponent(data.error));
                }
            } else {
                if (data.data) {
                    if (token && !data.isAuth) {
                        localStorage.clear();
                        toast("Tu sesión ha expirado.")
                        navigate("/");
                    } else {
                        setVideoData(data.data);
                        update(data.data);
                    }
                }
            }
        } catch (e) {
            navigate("/error");
        }
    }

    if (!videoData) {
        return (
            <div className="w-full flex justify-center">
                <Spinner className="w-14 h-14" />
            </div>
        );
    }

    return (
        <div className="flex min-h-svh w-full items-stretch justify-center p-3 pt-14 md:items-center md:p-10">
            <div className="grid w-full gap-4 md:h-[50vh] md:grid-cols-2">
                {videoData.isOwner ? <VideoPlayer /> : (
                    <VideoPreview video={videoData} />
                )}
                <div className="flex flex-col p-4">
                    <div className="flex items-center justify-between pb-3 gap-5">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-semibold">{videoData.title}</h1>
                            <p className="text-xs text-muted-foreground">
                                Subido {timeAgo(videoData.uploadedDate)} por
                                <span className="font-semibold text-primary"> {videoData.user}</span>
                            </p>
                        </div>
                        <VideoActions />
                    </div>
                    <Separator />
                    <div className="flex flex-col h-full gap-3 pt-2 md:justify-between">
                        <p className="text-sm mb-4 md:mb-0">{videoData.description}</p>
                        <div className="flex flex-col gap-3">
                            <p className="text-sm font-semibold">
                                Categoría: {videoCategories.find(({ id }) => id == videoData.category)?.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {videoData.isSensitiveContent ? "Contiene " : "No contiene "} contenido sensible.
                            </p>
                            <div className="flex gap-2">
                                {videoData.keywords.map(keyword => (
                                    <p key={keyword} className="text-sm bg-muted px-2 py-1 rounded-md">{keyword}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
import type { Video } from "@/lib/types";
import { API_URL, timeAgo } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Spinner from "../spinner";
import { toast } from "sonner";

/**
 * Displays the authenticated user's video library as a responsive grid of video cards.
 * Fetches the user's videos from the API and handles authentication errors.
 * Redirects to the login or error page as needed.
 */
export default function VideoLibrary() {
    const navigate = useNavigate();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        } else {
            getVideos(token);
        }
    }, []);

    const getVideos = async (token: String) => {
        try {
            const res = await fetch(API_URL + "/users/me/videos", {
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
                setVideos(data.videos);
                setLoading(false);
            }
        } catch (e) {
            navigate("/error");
        }
    }

    if (loading) return (
        <div className="w-full flex justify-center">
            <Spinner className="w-14 h-14" />
        </div>
    );

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {videos.map(video => (
                <VideoItem key={video._id} video={video} />
            ))}
        </div>
    );
}

/**
 * Renders a single video card with thumbnail, title, and relative upload time.
 * Navigates to the video details page when clicked.
 */
function VideoItem({ video }: { video: Video }) {
    return (
        <Link
            to={`/video/${video._id}`}
            className="flex flex-col overflow-clip rounded-xl border border-border
            transition-transform duration-200 hover:scale-[1.02] hover:shadow-sm"
        >
            <div>
                <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="aspect-16/9 h-full w-full object-cover object-center"
                />
            </div>
            <div className="p-3">
                <h3 className="mb-1 text-lg font-semibold md:text-2xl">
                    {video.title}
                </h3>
                <p className="text-muted-foreground text-xs">
                    {timeAgo(video.uploadedDate)}
                </p>
            </div>
        </Link>
    );
}

import { API_URL } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

interface Video {
    _id: string;
    title: string;
    description: string;
    category: string;
    keywords: string[];
    isSensitiveContent: boolean;
    uploadedDate: Date;
    thumbnail: string;
}

/**
 * Displays the authenticated user's video library as a responsive grid of video cards.
 * Fetches the user's videos from the API and handles authentication errors.
 * Redirects to the login or error page as needed.
 */
export default function VideoLibrary() {
    const navigate = useNavigate();
    const [videos, setVideos] = useState<Video[]>([]);

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
                    localStorage.removeItem("token");
                    navigate("/");
                } else {
                    navigate("/error?msg=" + encodeURIComponent(data.error));
                }
            } else {
                setVideos(data.videos);
            }
        } catch (e) {
            navigate("/error");
        }
    }

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
            to={`/cuenta/videos/${video._id}`}
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

/**
 * Returns a human-readable relative time string (e.g., "hace 2 días") for a given date.
 * Uses Intl.RelativeTimeFormat for Spanish localization.
 */
function timeAgo(dateISO: any) {
    const date: any = new Date(dateISO);
    const now: any = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

    const intervals: { unit: Intl.RelativeTimeFormatUnit, seconds: number }[] = [
        { unit: "year", seconds: 31536000 },
        { unit: "month", seconds: 2592000 },
        { unit: "week", seconds: 604800 },
        { unit: "day", seconds: 86400 },
        { unit: "hour", seconds: 3600 },
        { unit: "minute", seconds: 60 },
        { unit: "second", seconds: 1 },
    ];

    for (const { unit, seconds: intervalSeconds } of intervals) {
        const delta = Math.floor(seconds / intervalSeconds);
        if (delta >= 1) {
            return rtf.format(-delta, unit);
        }
    }

    return "justo ahora";
}

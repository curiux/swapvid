import type { Video } from "@/lib/types";
import { API_URL, timeAgo } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Spinner from "../spinner";
import { toast } from "sonner";
import Pagination from "../pagination";
import SemiCircle from "../semi-circle";
import { Separator } from "../ui/separator";

/**
 * VideoLibrary component
 * - Displays the authenticated user's video library as a responsive grid of video cards.
 * - Fetches videos and storage usage from the API, handling authentication and errors.
 * - Shows a semi-circle progress bar for storage, and the current/max video count.
 * - Redirects to login or error page as needed.
 */
export default function VideoLibrary() {
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [storage, setStorage] = useState({
        percentageUsed: 0,
        storageUsed: 0,
        storageLimit: 0
    });
    const [libraryMaxSize, setLibraryMaxSize] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        } else {
            const page = parseInt(params.get("page") || "0")
            setPage(page);
            getVideos(token, page);
        }
    }, []);

    const getVideos = async (token: String, page: number) => {
        try {
            const res = await fetch(API_URL + "/users/me/videos?page=" + page, {
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
                setTotalPages(data.totalPages);
                setStorage({
                    percentageUsed: (data.storageUsed / data.storageLimit) * 100,
                    storageUsed: data.storageUsed,
                    storageLimit: data.storageLimit
                });
                setLibraryMaxSize(data.libraryMaxSize);
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
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 items-start">
                <div className="rounded-md p-3 shadow-md dark:bg-muted">
                    <SemiCircle storage={storage} />
                </div>
                <p className="text-muted-foreground text-xs font-semibold">
                    Cantidad de videos: {videos.length} / {libraryMaxSize} máx.
                </p>
            </div>
            <Separator />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                {videos.length == 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {videos.length == 0 && page == 0 ? "Tu biblioteca está vacía." : "No hay videos para mostrar."}
                    </p>
                )
                    : videos.map(video => (
                        <VideoItem key={video._id} video={video} />
                    ))}
            </div>
            <Pagination list={videos} page={page} totalPages={totalPages} />
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

import type { Video } from "@/lib/types";
import Pagination from "../pagination";
import { API_URL, formatDuration, timeAgo } from "@/lib/utils";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import Spinner from "../spinner";
import { EmptyStar, FullStar, HalfStar } from "../exchange/exchange-rating-form";

/**
 * SearchVideoList component
 * - Fetches and displays a list of videos matching search keywords and filters from the URL.
 * - Parses query parameters for search term, category, order, sensitive content, and page.
 * - Builds the query string and requests results from the backend API.
 * - Handles loading state, API errors, and pagination updates on parameter changes.
 * - Uses the VideoItem component to render video cards and Pagination for navigation.
 * - Shows a spinner while loading and a message when no videos are found.
 */
export default function SearchVideoList() {
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        const page = parseInt(params.get("page") || "0")
        setPage(page);

        const q = params.get("q") || "";

        let query = "?q=" + q;
        if (params.get("category")) query += "&category=" + params.get("category");
        if (params.get("order")) query += "&order=" + params.get("order");
        if (params.get("sensitive")) query += "&sensitive=" + params.get("sensitive");

        setQuery(query);

        getVideos(query, page);
    }, [params.get("q"), params.get("category"), params.get("order"), params.get("sensitive")]);

    const getVideos = async (query: String, page: number) => {
        try {
            const res = await fetch(API_URL + `/videos${query}&page=${page}`);

            const data = await res.json();
            if (data.error) {
                navigate("/error?msg=" + encodeURIComponent(data.error));
            } else {
                setVideos(data.videos);
                setTotalPages(data.totalPages);
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
        <div className="flex flex-col gap-8 p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                {videos.length == 0 ? (
                    <p className="text-sm text-muted-foreground text-center col-span-4">
                        No se encontraron videos.
                    </p>
                )
                    : videos.map(video => (
                        <VideoItem key={video._id} video={video} />
                    ))}
            </div>
            <Pagination list={videos} page={page} totalPages={totalPages} query={query} />
        </div>
    );
}

/**
 * VideoItem component
 * - Renders a clickable card for a single video, showing its thumbnail, title, upload date, and user.
 * - Navigates to the video detail page when clicked.
 */
function VideoItem({ video }: { video: Video }) {
    return (
        <Link
            to={`/video/${video._id}`}
            className="flex flex-col overflow-clip rounded-xl border border-border
            transition-transform duration-200 hover:scale-[1.02] hover:shadow-sm"
        >
            <div className="relative">
                <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="aspect-16/9 h-full w-full object-cover object-center"
                />
                <span
                    className="absolute bottom-1 right-1 bg-black/75 text-white
            text-xs font-medium px-1.5 py-0.5 rounded"
                >
                    {formatDuration(video.duration)}
                </span>
            </div>
            <div className="p-3">
                <div className="flex flex-col justify-between md:flex-row md:items-end md:gap-2">
                    <h3 className="text-lg font-semibold truncate max-w-[75vw] md:mb-1 md:text-2xl">
                        {video.title}
                    </h3>
                    <div className="flex items-center gap-1">
                        <StarRating rating={video.rating!.value} />
                        <p className="text-xs">({video.rating!.count.toLocaleString()})</p>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-muted-foreground text-xs">
                        {timeAgo(video.uploadedDate)}
                    </p>
                    <p className="text-xs font-semibold">{video.user}</p>
                </div>
            </div>
        </Link>
    );
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1 w-18">
            {[1, 2, 3, 4, 5].map((i) =>
                rating >= i ? (
                    <FullStar key={i} />
                ) : rating >= i - 0.5 ? (
                    <HalfStar key={i} />
                ) : (
                    <EmptyStar key={i} />
                )
            )}
        </div>
    );
}
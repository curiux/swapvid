import { Link, useNavigate } from "react-router";
import { Button } from "../ui/button";
import { API_URL, timeAgo } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { Video } from "@/lib/types";
import Spinner from "../spinner";

/**
 * ExchangeVideoCard component
 * Renders a clickable video card for a given video ID, fetching video details from the API and handling navigation on error.
 * Displays a thumbnail, title, and upload date. Shows a spinner while loading.
 * Props:
 *   - videoId: string - The ID of the video to display.
 */
export default function ExchangeVideoCard({ videoId }: { videoId: string }) {
    const navigate = useNavigate();
    const [videoData, setVideoData] = useState<Video>();

    useEffect(() => {
        getVideoData();
    }, []);

    const getVideoData = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(API_URL + "/videos/" + videoId, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.data) {
                setVideoData(data.data);
            } else if (data.error) {
                navigate("/error?msg=" + encodeURIComponent(data.error));
            }
        } catch (e) {
            navigate("/error");
        }
    }

    if (!videoData) {
        return <Spinner />;
    }

    return (
        <Button
            asChild
            variant="outline"
            className="w-full h-full overflow-clip rounded-lg p-0 gap-1 transition duration-300 hover:scale-[102%] lg:col-span-2"
            aria-label="Ver información de video"
        >
            <Link to={"/video/" + videoData?._id} className="flex flex-col items-stretch" target="_blank">
                <div>
                    <img src={videoData.thumbnail} alt={videoData.title} className="object-contain h-full w-full" />
                </div>
                {videoData && (
                    <div className="flex flex-col w-full items-start gap-1 p-2">
                        <h2 className="text-2xl font-semibold">{videoData?.title}</h2>
                        <p className="text-xs text-muted-foreground">
                            {timeAgo(videoData.uploadedDate)}
                        </p>
                    </div>
                )}
            </Link>
        </Button>
    );
}
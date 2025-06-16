import type { Video } from "@/lib/types";
import Spinner from "../spinner";

/**
 * VideoPreview component
 * Renders a video thumbnail preview or a loading spinner if the video is not available.
 * Props:
 * - video: Optional Video object containing thumbnail and title.
 */
export default function VideoPreview({ video }: { video?: Video }) {
    if (!video) return (
        <Spinner />
    );

    return (
        <img src={video.thumbnail} alt={video.title} className="object-contain h-full w-full" />
    );
}
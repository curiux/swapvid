import { useVideoStore } from "@/lib/store";
import { useEffect, useRef } from "react";
import videojs from "video.js";

/**
 * VideoPlayer component
 * - Uses video.js to render a video player for the current video from the store
 * - Initializes and disposes the player on mount/unmount or when video changes
 * - Uses HLS (application/x-mpegURL) for video streaming
 */
export default function VideoPlayer() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
    const videoData = useVideoStore(state => state.video);

    useEffect(() => {
        if (!videoData || !videoRef.current) return;

        const src = videoData.url;

        if (!playerRef.current) {
            playerRef.current = videojs(videoRef.current, {
                controls: true,
                sources: [{
                    src,
                    type: "application/x-mpegURL"
                }]
            });
        } else {
            playerRef.current.src(src);
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [videoData]);

    return (
        <div className="w-full h-full">
            <video ref={videoRef} className="video-js vjs-fill" />
        </div>
    );
}
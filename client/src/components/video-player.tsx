import { useVideoStore } from "@/lib/store";
import { useEffect, useRef } from "react";
import videojs from "video.js";

/**
 * VideoPlayer component
 * - Renders a video player for the current video from the store using video.js.
 * - Initializes and disposes the player on mount/unmount and when the video changes.
 * - Automatically updates the video source when the video data changes.
 * - Supports HLS (application/x-mpegURL) streaming.
 */
export default function VideoPlayer() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
    const videoData = useVideoStore(state => state.video);

    useEffect(() => {
        if (!videoRef.current) return;

        playerRef.current = videojs(videoRef.current, {
            controls: true
        });

        return () => {
            playerRef.current?.dispose();
            playerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!videoData || !playerRef.current) return;

        playerRef.current.src({
            src: videoData.url,
            type: "application/x-mpegURL"
        });
    }, [videoData]);

    return (
        <div className="w-full h-full">
            <video ref={videoRef} className="video-js vjs-fill" />
        </div>
    );
}
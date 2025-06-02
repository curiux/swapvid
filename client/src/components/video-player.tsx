import { useVideoStore } from "@/lib/store";
import { useEffect, useRef } from "react";
import videojs from "video.js";

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
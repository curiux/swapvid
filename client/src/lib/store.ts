import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Video } from "./types"

interface VideoState {
    video: Video | null
    update: (data: Video) => void
}

export const useVideoStore = create<VideoState>()(
    persist(
        (set) => ({
            video: null,
            update: (data) => set({ video: data })
        }),
        { name: "video-storage" }
    )
);
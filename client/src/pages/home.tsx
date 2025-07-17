import SearchInput from "@/components/search-input";

/**
 * Home component
 * - Displays the landing page with a background video and dark overlay.
 * - Shows a title and a search input for discovering videos.
 */
export default function Home() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-3 md:p-10">
            <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-[-2]">
                <source src="https://res.cloudinary.com/dbxhjyaiv/video/upload/v1752670716/background_video_vfucse.mp4" type="video/mp4" />
            </video>

            <div className="absolute inset-0 bg-black opacity-90 z-[-1]"></div>

            <div className="flex flex-col items-center justify-center gap-8 w-full animate-fadeIn">
                <h1 className="text-2xl font-semibold font-sora text-center text-secondary md:text-5xl dark:text-primary">
                    Un lugar para compartir y descubrir videos
                </h1>
                <SearchInput filters={false} />
            </div>
        </div>
    );
}
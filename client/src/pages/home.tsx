import SearchInput from "@/components/search-input";

export default function Home() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-3 md:p-10">
            <div className="flex flex-col items-center justify-center gap-8 w-full">
                <h1 className="text-2xl font-semibold text-center md:text-5xl">Un lugar para compartir y descubrir videos</h1>
                <SearchInput filters={false} />
            </div>
        </div>
    );
}
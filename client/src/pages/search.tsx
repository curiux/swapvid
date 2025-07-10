import SearchInput from "@/components/search-input";
import { Separator } from "@/components/ui/separator";
import SearchVideoList from "@/components/video/search-video-list";

/**
 * Search page component
 * - Renders the search input, separator, and the list of search results.
 * - Composes SearchInput and SearchVideoList for the search experience.
 */
export default function Search() {
    return (
        <div className="flex flex-col items-center justify-center pt-18">
            <SearchInput />
            <Separator className="my-4" />
            <SearchVideoList />
        </div>
    );
}
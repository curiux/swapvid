import { SearchIcon, StepForward } from "lucide-react";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router";
import { useState } from "react";

/**
 * SearchInput component
 * - Renders a search input field and a button for navigating to the search results page.
 * - Updates the query state as the user types.
 * - Navigates to `/buscar?q=<query>` on Enter key or button click.
 */
export default function SearchInput() {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");

    return (
        <div className="max-w-lg w-full flex items-center gap-2">
            <div className="w-full flex h-10 items-center rounded-md border border-input bg-white pl-3 text-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2 dark:bg-input/30" >
                <SearchIcon className="h-[16px] w-[16px]" />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key == "Enter" && navigate(`/buscar?q=${query}`)}
                    className="w-full p-2 placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>
            <Button asChild variant="outline" className="h-10 cursor-pointer">
                <Link to={`/buscar?q=${query}`}>
                    <StepForward />
                </Link>
            </Button>
        </div>
    );
}
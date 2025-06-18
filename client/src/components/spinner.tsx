import { useEffect, useState } from "react";
import { useTheme } from "./theme-provider";
import spinnerLight from "../assets/spinner-light.svg";
import spinnerDark from "../assets/spinner-dark.svg";
import { cn } from "@/lib/utils";

/**
 * Spinner component displays a loading spinner that adapts to the current theme (light or dark).
 * - Uses the theme from the theme provider to select the appropriate spinner SVG.
 * - If the theme is set to 'system', it detects the user's system color scheme.
 * - Accepts an optional className prop for custom styling.
 */
export default function Spinner(props: { className?: string }) {
    const { className } = props;
    const { theme } = useTheme();
    const [spinnerUrl, setSpinnerUrl] = useState(spinnerLight);

    useEffect(() => {
        let currentTheme = theme;
        if (theme == "system") {
            currentTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        setSpinnerUrl(currentTheme == "light" ? spinnerDark : spinnerLight);
    }, []);

    return (
        <div className={cn("flex", className)}>
            <img
                src={spinnerUrl}
                alt="Loading..."
                data-testid="loading"
            />
        </div>
    );
}
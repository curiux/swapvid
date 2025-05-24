import notFoundLight from "../assets/404-light.svg";
import notFoundDark from "../assets/404-dark.svg";
import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export default function NotFound() {
    const { theme } = useTheme();
    const [notFoundUrl, setNotFoundUrl] = useState(notFoundLight);

    useEffect(() => {
        let currentTheme = theme;
        if (theme == "system") {
            currentTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        setNotFoundUrl(currentTheme == "light" ? notFoundLight : notFoundDark);
    }, [theme]);

    return (
        <section className="flex min-h-svh w-full items-center justify-center p-3 md:p-10">
            <div className="flex flex-col justify-center items-center">
                <img src={notFoundUrl} alt="Imagen no encontrado" className="w-1/2" />
                <p className="text-xl font-semibold mb-4">Parece que estás perdido...</p>
                <Button asChild>
                    <Link to="/">Volver a la página principal</Link>
                </Button>
            </div>
        </section>
    );
}
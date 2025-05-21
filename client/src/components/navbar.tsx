import { CircleUserIcon, Menu, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "./theme-provider";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";

interface MenuItem {
    title: string;
    url: string;
    description?: string;
    icon?: React.ReactNode;
    items?: MenuItem[];
}

interface NavbarData {
    logo: {
        src: string;
        alt: string;
        title: string;
    };
    menu: MenuItem[];
    auth: {
        login: {
            title: string;
            url: string;
        };
        signup: {
            title: string;
            url: string;
        };
        account: {
            url: string;
        }
    };
}

const navbarData: NavbarData = {
    logo: {
        src: "https://res.cloudinary.com/dbxhjyaiv/image/upload/v1747778550/logo_laoif2.svg",
        alt: "logo",
        title: "SwapVid"
    },
    menu: [
        { title: "Inicio", url: "/" }
    ],
    auth: {
        login: { title: "Iniciar Sesión", url: "/login" },
        signup: { title: "Registrarse", url: "/registro" },
        account: { url: "/cuenta" }
    }
}

/**
 * This component renders the main navigation bar for the application.
 * It displays the logo, navigation menu, authentication buttons, and a theme toggle.
 * The navigation adapts for both desktop and mobile views.
 */
export default function Navbar() {
    const { logo, menu } = navbarData;
    const [open, setOpen] = useState(false);

    const closeSheet = () => setOpen(false);

    return (
        <section className="p-4 fixed top-0 left-0 w-full z-50 bg-background">
            <div className="container">
                {/* Desktop Menu */}
                <nav className="hidden justify-between lg:flex">
                    <div className="flex items-center gap-6">
                        {/* Logo */}
                        <div className="flex items-center gap-2 cursor-default">
                            <img src={logo.src} className="max-h-8" alt={logo.alt} />
                            <span className="text-lg font-semibold tracking-tighter">
                                {logo.title}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <NavigationMenu>
                                <NavigationMenuList>
                                    {menu.map((item) => renderMenuItem(item))}
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {AuthButtons(closeSheet)}
                        <ChangeThemeIcon />
                    </div>
                </nav>

                {/* Mobile Menu */}
                <div className="block lg:hidden">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <img src={logo.src} className="max-h-8" alt={logo.alt} />
                        </div>
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Menu className="size-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>
                                        <div className="flex items-center gap-2">
                                            <img src={logo.src} className="max-h-8" alt={logo.alt} />
                                        </div>
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col gap-6 p-4">
                                    <div className="flex w-full flex-col gap-4">
                                        {menu.map((item) => renderMobileMenuItem(item, closeSheet))}
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {AuthButtons(closeSheet)}
                                        <ChangeThemeIcon />
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Renders a single menu item for the desktop navigation menu.
const renderMenuItem = (item: MenuItem) => {
    return (
        <NavigationMenuItem key={item.title}>
            <NavigationMenuLink
                className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-accent-foreground"
                asChild
            >
                <Link to={item.url}>{item.title}</Link>
            </NavigationMenuLink>
        </NavigationMenuItem>
    );
};

// Renders a single menu item for the mobile navigation menu.
const renderMobileMenuItem = (item: MenuItem, closeSheet?: () => void) => {
    return (
        <Link
            key={item.title}
            to={item.url}
            className="text-md font-semibold"
            onClick={closeSheet}
        >
            {item.title}
        </Link>
    );
};

/** Renders authentication buttons based on user authentication state. */
function AuthButtons(closeSheet?: () => void) {
    const { auth } = navbarData;
    const [isAuth, setIsAuth] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("token");
            setIsAuth(token ? true : false);
        }
        checkAuth();
    }, [location]);

    if (isAuth) {
        return (
            <Button asChild size="sm">
                <Link to={auth.account.url} onClick={closeSheet}>
                    <CircleUserIcon />
                </Link>
            </Button>
        )
    } else {
        return (
            <>
                <Button asChild variant="outline" size="sm">
                    <Link to={auth.login.url} onClick={closeSheet}>{auth.login.title}</Link>
                </Button>
                <Button asChild size="sm">
                    <Link to={auth.signup.url} onClick={closeSheet}>{auth.signup.title}</Link>
                </Button>
            </>
        )
    }
}

/** Renders a theme toggle button for switching between light and dark modes. */
function ChangeThemeIcon() {
    const { theme, setTheme } = useTheme();
    
    const changeTheme = () => {
        let currentTheme = theme;
        if (theme == "system") {
            currentTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        setTheme(currentTheme == "light" ? "dark" : "light");
    }

    return (
        <Button asChild variant="outline" onClick={changeTheme}>
            <div>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </div>
        </Button>
    )
}
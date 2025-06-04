import { CircleUserIcon, FileTextIcon, HomeIcon, Menu, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "./theme-provider";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Separator } from "@/components/ui/separator";

interface NavbarData {
    logo: {
        src: string;
        alt: string;
        title: string;
    };
    home: {
        label: string;
        icon: React.ReactNode;
        url: string;
    };
    privacyPolicy: {
        label: string;
        icon: React.ReactNode;
        url: string;
    }
}

const navbarData: NavbarData = {
    logo: {
        src: "https://res.cloudinary.com/dbxhjyaiv/image/upload/v1747778550/logo_laoif2.svg",
        alt: "logo",
        title: "SwapVid"
    },
    home: {
        label: "Inicio",
        icon: <HomeIcon />,
        url: "/"
    },
    privacyPolicy: {
        label: "Política de privacidad",
        icon: <FileTextIcon />,
        url: "/politica-de-privacidad"
    }
}

/**
 * This component renders the main navigation bar for the application.
 * It displays the logo, navigation menu, authentication buttons, and a theme toggle.
 * The navigation adapts for both desktop and mobile views.
 */
export default function Navbar() {
    const { logo, home, privacyPolicy } = navbarData;
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
                        {/* Menu items */}
                        <NavigationMenu className="flex items-center">
                            <NavigationMenuList>
                                <NavigationMenuItem className="px-1">
                                    <Button asChild variant="outline" size="sm">
                                        <Link to={privacyPolicy.url} aria-label={privacyPolicy.label}>
                                            {privacyPolicy.icon}
                                        </Link>
                                    </Button>
                                </NavigationMenuItem>
                                <NavigationMenuItem className="px-1">
                                    <Button asChild size="sm">
                                        <Link to={home.url} aria-label={home.label}>
                                            {home.icon}
                                        </Link>
                                    </Button>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>
                    <div className="flex items-center gap-2">
                        <AuthButtons closeSheet={closeSheet} isMobile={false} />
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
                            <Button asChild variant="outline" size="icon" aria-label="Abrir menú">
                                <SheetTrigger>
                                    <Menu className="size-4" />
                                </SheetTrigger>
                            </Button>
                            <SheetContent className="overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>
                                        <div className="flex items-center gap-2">
                                            <img src={logo.src} className="max-h-8" alt={logo.alt} />
                                        </div>
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col gap-6 p-4">
                                    <div className="flex gap-4">
                                        <Button
                                            asChild
                                            size="sm"
                                            className="flex-1"
                                            onClick={closeSheet}
                                        >
                                            <Link to={home.url} aria-label={home.label}>
                                                {home.icon}
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={closeSheet}
                                        >
                                            <Link to={privacyPolicy.url} aria-label={privacyPolicy.label}>
                                                {privacyPolicy.icon}
                                            </Link>
                                        </Button>
                                    </div>

                                    <Separator />

                                    <div className="flex flex-col gap-3">
                                        <AuthButtons closeSheet={closeSheet} isMobile={true} />
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

// Renders authentication buttons based on user authentication state.
function AuthButtons({ closeSheet, isMobile }: { closeSheet?: () => void, isMobile: boolean }) {
    const navigate = useNavigate();
    const [isAuth, setIsAuth] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("token");
            setIsAuth(token ? true : false);
        }
        checkAuth();
    }, [location]);

    const logout = () => {
        localStorage.clear();
        navigate("/");
        closeSheet!();
    }

    if (!isAuth) {
        return (
            <>
                <Button asChild variant="outline" size="sm">
                    <Link to="/login" onClick={closeSheet}>Iniciar Sesión</Link>
                </Button>
                <Button asChild size="sm">
                    <Link to="/registro" onClick={closeSheet}>Registrarse</Link>
                </Button>
                {isMobile && <Separator />}
            </>
        );
    }

    if (isMobile) {
        return (
            <div className="flex flex-col text-center gap-4">
                <Link
                    to="/mi-coleccion"
                    onClick={closeSheet}
                    className="text-sm font-medium rounded-sm bg-input/30 border shadow p-2 hover:underline"
                >
                    Mi colección
                </Link>
                <Link
                    to="/perfil"
                    onClick={closeSheet}
                    className="text-sm font-medium rounded-sm bg-primary text-secondary border shadow p-2 hover:underline"
                >
                    Mi perfil
                </Link>
                <Button
                    variant="ghost"
                    onClick={logout}
                    className="text-sm font-medium rounded-sm bg-input/30 border shadow p-2 hover:underline"
                >
                    Cerrar Sesión
                </Button>
                <Separator />
            </div>
        );
    }

    return (
        <NavigationMenu viewport={false}>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="p-2 rounded-lg hover:bg-muted transition">
                        <CircleUserIcon className="w-5 h-5" />
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="min-w-[150px] translate-x-[-50%]">
                        <ul className="grid gap-2">
                            <li>
                                <NavigationMenuLink asChild>
                                    <Link to="/mi-coleccion" onClick={closeSheet} aria-label="Mi colección">
                                        <p className="line-clamp-2 text-sm leading-snug">
                                            Mi colección
                                        </p>
                                    </Link>
                                </NavigationMenuLink>
                                <NavigationMenuLink asChild>
                                    <Link to="/perfil" onClick={closeSheet} aria-label="Mi perfil">
                                        <p className="line-clamp-2 text-sm leading-snug">
                                            Mi perfil
                                        </p>
                                    </Link>
                                </NavigationMenuLink>
                                <NavigationMenuLink asChild>
                                    <p onClick={logout} className="cursor-pointer line-clamp-2 text-sm leading-snug">
                                        Cerrar sesión
                                    </p>
                                </NavigationMenuLink>
                            </li>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}

// Renders a theme toggle button for switching between light and dark modes.
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
        <Button asChild variant="outline" aria-label="Cambiar tema" onClick={changeTheme}>
            <div>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </div>
        </Button>
    )
}
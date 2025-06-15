import AccountSidebar from "@/components/account-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";

/**
 * This component renders the account page.
 * If a user is not authenticated (no "token" in localStorage),
 * it automatically redirects them to the home page using React Router's navigate function.
 * Otherwise, it displays the account sidebar and nested account routes.
 */
export default function MyCollection() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        }
    }, []);

    return (
        <SidebarProvider>
            <AccountSidebar />
            <SidebarInset className="pt-16">
                <header className="flex h-12 ptshrink-0 items-center gap-2 border-b px-2">
                    <SidebarTrigger />
                </header>
                <Outlet />
            </SidebarInset>
        </SidebarProvider>
    );
}
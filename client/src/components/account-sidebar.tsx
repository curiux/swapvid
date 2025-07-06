import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Repeat, SquarePlay } from "lucide-react";
import { Link } from "react-router";

const baseUrl = "/mi-coleccion";

const items = [
    {
        title: "Mis videos",
        url: "/",
        icon: <SquarePlay />
    },
    {
        title: "Mis intercambios",
        url: "/intercambios",
        icon: <Repeat />
    }
];

/**
 * This component renders the sidebar for the user's account section.
 * It provides navigation links for account-related pages.
 * The sidebar uses shadcn Sidebar UI components.
 */
export default function AccountSidebar() {
    const { setOpenMobile } = useSidebar();

    const handleClick = () => setOpenMobile(false);

    return (
        <Sidebar collapsible="offcanvas" variant="inset">
            <SidebarContent>
                <SidebarMenu className="py-4 px-2 md:pt-20">
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild tooltip={item.title} onClick={handleClick}>
                                <Link to={baseUrl + item.url}>
                                    {item.icon}
                                    {item.title}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    )
}

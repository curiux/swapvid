import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Link, useNavigate } from "react-router";

const items = [
    {
        title: "Mis videos",
        url: "/cuenta"
    },
    {
        title: "Administar cuenta",
        url: "/cuenta/ajustes"
    }
];

/**
 * This component renders the sidebar for the user's account section.
 * It provides navigation links for account-related pages.
 * The sidebar uses shadcn Sidebar UI components.
 */
export default function AccountSidebar() {
    const { setOpenMobile } = useSidebar();
    const navigate = useNavigate();

    const handleClick = () => setOpenMobile(false);

    const logout = () => {
        localStorage.clear();
        navigate("/");
    }

    return (
        <Sidebar collapsible="offcanvas" variant="inset">
            <SidebarContent>
                <SidebarMenu className="py-4 px-2 md:pt-20">
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild tooltip={item.title} onClick={handleClick}>
                                <Link to={item.url}>{item.title}</Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Cerrar sesión" onClick={logout} className="cursor-pointer">
                            Cerrar sesión
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    )
}

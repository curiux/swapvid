import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useEffect, useState } from "react";
import { Bell, CheckCheck, CheckCircle, MailOpen, XCircle } from "lucide-react";
import { API_URL, timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import type { Notification } from "@/lib/types";
import Spinner from "./spinner";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";

/**
 * Notifications component
 * - Displays a dialog with the user's notifications, including unread count and notification details.
 * - Fetches notifications from the API, handles authentication, and error states.
 * - Allows marking all notifications as read and navigating to related pages.
 */
export default function Notifications() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [isAuth, setIsAuth] = useState(false);
    const [currentToken, setCurrentToken] = useState("");
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("token");
            setIsAuth(token ? true : false);
            if (token && token != currentToken) setCurrentToken(token);
        }
        checkAuth();
    }, [location]);

    useEffect(() => {
        if (!open) return;
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        } else {
            getNotifications(token);
        }
    }, [open, currentToken]);

    const getNotifications = async (token: String) => {
        try {
            const res = await fetch(API_URL + "/users/me/notifications", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.error) {
                if (res.status == 401 || res.status == 404) {
                    localStorage.clear();
                    toast("Tu sesión ha expirado.")
                    navigate("/");
                } else {
                    navigate("/error?msg=" + encodeURIComponent(data.error));
                }
            } else {
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
                setLoading(false);
            }
        } catch (e) {
            navigate("/error");
        }
    }

    const handleReadAll = async () => {
        if (unreadCount == 0) return;

        const token = localStorage.getItem("token");

        try {
            const res = await fetch(API_URL + "/users/me/notifications", {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.error) {
                if (res.status == 401 || res.status == 404) {
                    localStorage.clear();
                    toast("Tu sesión ha expirado.")
                    navigate("/");
                } else {
                    navigate("/error?msg=" + encodeURIComponent(data.error));
                }
            } else {
                getNotifications(token!);
            }
        } catch (e) {
            navigate("/error");
        }
    }

    if (!isAuth) return;

    return (
        <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
            <DialogTrigger asChild>
                <div className="relative">
                    <Button variant="ghost" className="cursor-pointer rounded-full" aria-label="Mostrar notificaciones" data-testid="open">
                        <Bell />
                    </Button>
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 rounded-full px-1.5 py-0 text-xs">
                            {unreadCount}
                        </Badge>
                    )}
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Notificaciones</DialogTitle>
                </DialogHeader>
                {loading ? (
                    <Spinner />
                ) : notifications.length == 0
                    ? <p className="text-sm text-muted-foreground">
                        No tienes notificaciones.
                    </p>
                    : (
                        <div className="grid w-full max-w-xl items-start gap-4">
                            {notifications.map((notification: Notification) => (
                                <NotificationItem
                                    key={notification._id}
                                    notification={notification}
                                    getNotifications={getNotifications}
                                    setOpen={setOpen}
                                />
                            ))}
                        </div>
                    )}
                <DialogFooter>
                    {notifications.length != 0 && (
                        <Button variant="outline" onClick={handleReadAll} className="mx-auto">
                            <CheckCheck />
                            Marcar todo como leido
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * NotificationItem component
 * - Renders a single notification card with icon, message, and relative time.
 * - Handles marking the notification as read and navigation to the relevant page.
 */
function NotificationItem({ notification, getNotifications, setOpen }:
    {
        notification: Notification,
        getNotifications: (token: string) => void,
        setOpen: (value: React.SetStateAction<boolean>) => void
    }
) {
    const navigate = useNavigate();

    const handleClick = async () => {
        setOpen(false);
        if (notification.isRead) return;

        const token = localStorage.getItem("token");

        try {
            const res = await fetch(API_URL + "/users/me/notifications/" + notification._id, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.error) {
                if (res.status == 401 || res.status == 404) {
                    localStorage.clear();
                    toast("Tu sesión ha expirado.")
                    navigate("/");
                } else {
                    navigate("/error?msg=" + encodeURIComponent(data.error));
                }
            } else {
                getNotifications(token!);
            }
        } catch (e) {
            navigate("/error");
        }
    }

    return (
        <Link to="/mi-coleccion/intercambios" onClick={handleClick}>
            <Alert className={!notification.isRead ? "bg-muted" : ""}>
                {notification.type == "exchange_requested"
                    ? <MailOpen />
                    : notification.type == "exchange_accepted"
                        ? <CheckCircle />
                        : <XCircle />}
                <AlertDescription className="text-primary">
                    <span>{notification.message}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</span>
                </AlertDescription>
            </Alert>
        </Link>
    );
}
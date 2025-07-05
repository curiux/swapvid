import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader } from "../ui/card";
import { useEffect, useState } from "react";
import { API_URL, exchangeStatusList, timeAgo } from "@/lib/utils";
import type { Exchange } from "@/lib/types";
import { Separator } from "../ui/separator";
import { BadgeX, Repeat } from "lucide-react";
import ExchangeActions from "./exchange-actions";
import Spinner from "../spinner";
import { toast } from "sonner";

/**
 * ExchangeList component
 * Fetches and displays a list of exchanges for the current user.
 * Renders each exchange with its status, participants, and associated videos.
 */
export default function ExchangeList() {
    const navigate = useNavigate();
    const [exchanges, setExchanges] = useState<Exchange[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        } else {
            getExchanges(token);
        }
    }, []);

    const getExchanges = async (token: String) => {
        try {
            const res = await fetch(API_URL + "/users/me/exchanges", {
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
                setExchanges(data.exchanges);
                setLoading(false);
            }
        } catch (e) {
            navigate("/error");
        }
    }

    if (loading) return (
        <div className="w-full flex justify-center">
            <Spinner className="w-14 h-14" />
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            {exchanges.map(exchange => {
                const user = exchange.user == "initiator" ? exchange.responder : exchange.initiator
                const status = exchangeStatusList.find(s => s.id == exchange.status);
                return <ExchangeItem key={exchange._id} exchange={exchange} user={user} status={status} />
            })}
        </div>
    );
}

/**
 * ExchangeItem component
 * Renders a card for a single exchange, showing participants, status, and video previews.
 * Props:
 * - exchange: Exchange object to display.
 * - user: string representing the other participant in the exchange.
 * - status: status object containing label and color for the exchange status.
 */
function ExchangeItem({ exchange, user, status }: { exchange: Exchange, user: string, status: any }) {
    return (
        <Card className="flex">
            <CardHeader>
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex flex-col gap-1">
                        <CardDescription>Intercambio con <span className="font-bold">{user}</span> |
                            iniciado {timeAgo(exchange.requestedDate)}</CardDescription>
                        <CardDescription>Estado: <span className={`${status.color} text-muted text-xs font-semibold p-1 rounded-md`}>{status.label}</span></CardDescription>
                    </div>
                    <ExchangeActions exchangeId={exchange._id} status={exchange.status} user={exchange.user!} hasRated={exchange.hasRated!} />
                </div>
            </CardHeader>
            <Separator />
            <CardContent>
                <div className="grid grid-cols-5 w-full">
                    {exchange.initiatorVideoUrl ? (
                        <img
                            src={exchange.initiatorVideoUrl}
                            alt="Video del iniciador"
                            className="col-span-2 object-contain h-full w-full" />
                    ) : (
                        <div className="col-span-2 flex flex-col items-center justify-center">
                            <BadgeX className="w-1/3 h-full" />
                            <p className="text-center text-sm">Todavía no se ha elegido un video</p>
                        </div>
                    )}
                    <div className={`flex items-center justify-center ${exchange.user == "initiator" ? "-order-1" : ""}`}>
                        <Repeat className="w-1/2 h-full" />
                    </div>
                    <img
                        src={exchange.responderVideoUrl}
                        alt="Video del receptor"
                        className={`col-span-2 object-contain h-full w-full ${exchange.user == "initiator" ? "-order-2" : ""}`} />
                </div>
            </CardContent>
        </Card>
    );
}
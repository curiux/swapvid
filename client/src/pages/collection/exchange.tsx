import ExchangeVideoCard from "@/components/exchange/exchange-video-card";
import ExchangeVideoList from "@/components/exchange/exchange-video-list";
import Spinner from "@/components/spinner";
import { Card } from "@/components/ui/card";
import type { Exchange } from "@/lib/types";
import { API_URL } from "@/lib/utils";
import { Repeat } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast, Toaster } from "sonner";

/**
 * Exchange page
 * Handles the video exchange process between users, including fetching exchange data and rendering the UI for selecting and confirming exchanges.
 */
export default function Exchange() {
    const navigate = useNavigate();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [exchangeData, setExchangeData] = useState<Exchange>();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        } else {
            getExchangeData(token);
        }
    }, []);

    const getExchangeData = async (token: String) => {
        const exchangeId = params.id;

        try {
            const res = await fetch(API_URL + "/exchanges/" + exchangeId, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.error) {
                if (res.status == 401 || res.status == 404) {
                    localStorage.clear();
                    navigate("/");
                } else {
                    navigate("/error?msg=" + encodeURIComponent(data.error));
                }
            } else if (res.status == 403) {
                navigate("/mi-coleccion/intercambios");
            } else if (res.status == 200 && data.data) {
                const exchange: Exchange = data.data;
                if (exchange.status != "pending" || exchange.user == "initiator") {
                    navigate("/mi-coleccion/intercambios");
                }
                setExchangeData(exchange);
                setLoading(false);
            }
        } catch (e) {
            navigate("/error");
        }
    }

    const exchange = async (selectedVideo: string) => {
        if (!selectedVideo) {
            toast.error("Selecciona un video");
            return;
        }

        setLoading(true);
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(API_URL + "/exchanges/" + exchangeData?._id, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: "accepted",
                    videoId: selectedVideo
                })
            });

            const data = await res.json();
            if (data.error) {
                if (res.status == 401 || res.status == 404) {
                    localStorage.clear();
                    navigate("/");
                } else {
                    navigate("/error?msg=" + encodeURIComponent(data.error));
                }
            } else {
                localStorage.setItem("msg", "¡Intercambio realizado correctamente!");
                navigate("/mi-coleccion/intercambios");
            }
        } catch (e) {
            navigate("/error");
        }

        setLoading(false);
    }

    return (
        <div className="flex w-full items-center justify-center p-5">
            <Toaster position="top-center" />
            {loading ? (
                <Spinner className="w-14 h-14" />
            ) : (
                <div className="flex flex-col items-center justify-center gap-10 w-full">
                    <h1 className="text-3xl font-semibold">Intercambio de videos</h1>
                    <Card className="grid p-5 lg:grid-cols-5">
                        {exchangeData && <ExchangeVideoCard videoId={exchangeData.responderVideo} />}
                        <div className="flex items-center justify-center">
                            <Repeat className="w-1/6 h-full lg:w-1/4" />
                        </div>
                        {exchangeData && <ExchangeVideoList userId={exchangeData.initiator} exchange={exchange} />}
                    </Card>
                </div>
            )}
        </div>
    );
}
import Spinner from "@/components/spinner";
import ExchangesStats from "@/components/statistics/exchanges-stats";
import VideoListStats from "@/components/statistics/video-list-stats";
import { Card, CardContent } from "@/components/ui/card";
import { API_URL } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

/**
 * Statistics page
 * - Displays an overview of user statistics including total video views and exchanges.
 * - Uses ExchangesStats and VideoListStats components to render detailed statistics.
 * - Fetches data from the backend and handles loading and error states.
 */
export default function Statistics() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [totalViews, setTotalViews] = useState(0);
    const [totalExchanges, setTotalExchanges] = useState(0);
    const [exchangeCounts, setExchangeCounts] = useState({
        pending: 0,
        accepted: 0,
        rejected: 0
    });
    const [topVideos, setTopVideos] = useState([]);
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        } else {
            getStatistics(token);
        }
    }, []);

    const getStatistics = async (token: string) => {
        try {
            const res = await fetch(API_URL + "/statistics", {
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
                setTotalViews(data.totalViews);
                setTotalExchanges(data.totalExchanges);
                setExchangeCounts(data.exchangeCounts);
                setTopVideos(data.topVideos);
                setVideos(data.videos);
                setLoading(false);
            }
        } catch (e) {
            navigate("/error");
        }
    }

    if (loading) return (
        <div className="w-full flex justify-center pt-12">
            <Spinner className="w-14 h-14" />
        </div>
    );

    return (
        <div className="p-5">
            <h1 className="mb-3 text-2xl font-semibold">Estadísticas</h1>
            <div className="grid gap-4 xl:grid-cols-3">
                <div className="flex flex-col col-span-2 gap-3 xl:col-span-1">
                    <Card>
                        <CardContent>
                            <h3 className="text-sm text-muted-foreground">Vistas de videos totales</h3>
                            <p className="text-4xl font-bold">{totalViews.toLocaleString()}</p>
                        </CardContent>
                    </Card>

                    <Card className="col-span-1">
                        <CardContent className="flex flex-col gap-3 md:flex-row">
                            <ExchangesStats totalExchanges={totalExchanges} exchangeCounts={exchangeCounts} />
                        </CardContent>
                    </Card>
                </div>
                <VideoListStats statName="Vistas" topVideos={topVideos} videos={videos} statsType="views" />
                <VideoListStats statName="Intercambios" topVideos={[]} videos={videos} statsType="exchanges" />
            </div>
        </div>
    );
}
import type { Video } from "@/lib/types";
import { API_URL, timeAgo } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { ChevronRightIcon } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { toast } from "sonner";

/**
 * ExchangeVideoList component
 * Fetches and displays a list of videos for a given user, allowing selection for exchange.
 * Props:
 * - userId: string representing the user whose videos are listed.
 * - exchange: function to call with the selected video ID.
 */
export default function ExchangeVideoList({ userId, exchange }: { userId: string, exchange: (videoId: string) => void }) {
    const navigate = useNavigate();
    const [videos, setVideos] = useState<Video[]>([]);
    const [selected, setSelected] = useState("");
    const [open, setOpen] = useState(false);

    useEffect(() => {
        getVideos();
    }, []);

    const handleSelect = (videoId: string) => {
        setSelected(videoId);
    }

    const getVideos = async () => {
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(API_URL + `/users/${userId}/videos`, {
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
                setVideos(data.videos);
            }
        } catch (e) {
            navigate("/error");
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!selected) {
            exchange(selected);
            setOpen(false);
        } else {
            setOpen(open);
        }
    }

    return (
        <ScrollArea className="lg:col-span-2">
            <div className="flex flex-col gap-3 max-h-[35svh] pr-3">
                <h2 className="font-light text-sm">Elige el video por el que quieres intercambiarlo</h2>
                {videos.map(video => (
                    <VideoItem key={video._id} video={video} selected={selected} select={handleSelect} />
                ))}
            </div>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    <div className="absolute bottom-0 right-0 z-10">
                        <Button className="cursor-pointer" data-testid="chevron-trigger">
                            <ChevronRightIcon />
                        </Button>
                    </div>
                </DialogTrigger>
                <DialogContent className="min-w-1/2 max-w-full max-h-screen overflow-y-auto sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Intercambio</DialogTitle>
                        <DialogDescription>
                            Estás seguro de que quieres realizar este intercambio? Perderás acceso al video de tu biblioteca elegido por el otro usuario y obtendrás acceso al video elegido.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" aria-label="Cancelar">Cancelar</Button>
                        </DialogClose>
                        <Button onClick={() => {
                            setOpen(false);
                            exchange(selected);
                        }}>
                            Intercambiar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ScrollArea>
    );
}

/**
 * VideoItem component
 * Renders a selectable video card for use in the exchange list.
 * Props:
 * - video: Video object to display.
 * - selected: ID of the currently selected video.
 * - select: function to call when this video is selected.
 */
function VideoItem({ video, selected, select }: { video: Video, selected: string, select: (videoId: string) => void }) {
    return (
        <Button
            variant="outline"
            onClick={() => select(video._id)}
            className={`flex flex-col w-full h-full whitespace-normal p-0 overflow-clip
            ${selected == video._id ? "border-3 !border-green-400" : ""}`}
            aria-label="Seleccionar video"
        >
            <img
                src={video.thumbnail}
                alt={video.title}
                className="aspect-16/9 w-full h-full object-cover object-center"
            />
            <div className="p-3 w-full text-start">
                <h3 className="mb-1 text-lg font-semibold md:text-2xl">
                    {video.title}
                </h3>
                <p className="text-muted-foreground text-xs">
                    {timeAgo(video.uploadedDate)}
                </p>
                <Button asChild variant="link" className="p-0">
                    <Link to={"/video/" + video._id} target="_blank">Ver más</Link>
                </Button>
            </div>
        </Button>
    );
}
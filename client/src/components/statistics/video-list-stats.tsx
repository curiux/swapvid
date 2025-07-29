import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { API_URL, cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import Spinner from "../spinner";

interface Video {
    _id: string;
    title: string;
    thumbnail?: string;
    views?: number;
    exchangesCount?: number;
}

export default function VideoListStats({ statName, topVideos, videos, statsType }:
    { statName: string, topVideos: Video[], videos: Video[], statsType: string }) {
    const navigate = useNavigate();
    const [videoSelected, setVideoSelected] = useState<Video | null>(null);
    const [loading, setLoading] = useState(false);

    const loadVideoStats = async (videoId: string) => {
        if (videoId == "") {
            setVideoSelected(null);
            return;
        }

        setLoading(true);
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(API_URL + "/statistics/videos/" + videoId + "?type=" + statsType, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.error) {
                navigate("/error?msg=" + encodeURIComponent(data.error));
            } else {
                setVideoSelected(data.data);
                setLoading(false);
            }
        } catch (e) {
            navigate("/error");
        }
    }

    return (
        <div className="flex flex-col gap-4 col-span-2 lg:col-span-1">
            <h2 className="text-lg font-semibold">{statName} por video</h2>
            <div className="flex gap-2">
                <VideoSearch videos={videos} loadVideoStats={loadVideoStats} />
            </div>
            {loading
                ? <Spinner className="w-14 h-14" />
                : videoSelected == null ? topVideos.map(video => (
                    <VideoItem key={video._id} video={video} statName={statName} />
                )) : (
                    <VideoItem video={videoSelected} statName={statName} statsType={statsType} />
                )}
        </div>
    );
}

function VideoItem({ video, statName, statsType }: { video: Video, statName: string, statsType?: string }) {
    console.log(video)
    return (
        <div className="flex items-center justify-between w-full overflow-clip border rounded-md">
            <img
                src={video.thumbnail}
                alt={video.title}
                className="object-contain w-32"
            />
            <div className="p-3">
                <h3 className="text-md font-semibold text-muted-foreground">
                    {statName} de <span className="italic">{video.title}</span>
                </h3>
                <p className="text-xl font-semibold md:text-right">
                    {(!statsType || statsType == "views")
                        ? video.views!.toLocaleString()
                        : video.exchangesCount!.toLocaleString()}
                </p>
            </div>
        </div>
    );
}

function VideoSearch({ videos, loadVideoStats }: { videos: Video[], loadVideoStats: (id: string) => void }) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");

    useEffect(() => {
        loadVideoStats(value);
    }, [value]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                >
                    {value
                        ? videos.find((video) => video._id === value)?.title
                        : "Selecciona un video..."}
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            {value != "" && (
                <Button size="icon" variant="outline" onClick={() => setValue("")}>
                    <X />
                </Button>
            )}
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Selecciona un video..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>No hay videos.</CommandEmpty>
                        <CommandGroup>
                            {videos.map((video) => (
                                <CommandItem
                                    key={video._id}
                                    value={video._id}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue === value ? "" : currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    {video.title}
                                    <Check
                                        className={cn(
                                            "ml-auto",
                                            value === video._id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
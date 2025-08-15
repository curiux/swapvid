import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Tag, TagInput } from "emblor";
import React, { useEffect, useRef, useState } from "react";
import { Textarea } from "../ui/textarea";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { Separator } from "../ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { API_URL, videoCategories, MAX_FILE_SIZE_BY_PLAN, formatBytes, calculateHash } from "@/lib/utils";
import { UploadIcon } from "lucide-react";
import axios from "axios";
import { Progress } from "../ui/progress";
import { useNavigate } from "react-router";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";

/**
 * This schema defines validation rules for the video upload form using Zod.
 * - title: Required, 5-60 characters.
 * - description: Required, 10-500 characters.
 * - category: Required.
 * - keywords: Required, array of at least 1 keyword object.
 * - isSensitiveContent: Boolean flag for sensitive content.
 * - video: Required, must be a supported video file and within size limit for the user's plan.
 */
export function createFormSchema(plan: keyof typeof MAX_FILE_SIZE_BY_PLAN) {
    const maxSize = MAX_FILE_SIZE_BY_PLAN[plan];

    return z.object({
        title: z.string({
            required_error: "Ingresa un título."
        })
            .min(5, { message: "El título debe tener al menos 5 caracteres." })
            .max(60, { message: "El título no debe superar los 60 caracteres." }),
        description: z.string({
            required_error: "Ingresa una descripción."
        })
            .min(10, { message: "La descripción debe tener al menos 10 caracteres." })
            .max(500, { message: "La descripción no debe superar los 500 caracteres." }),
        category: z.string({
            required_error: "Debes seleccionar una categoría."
        }),
        keywords: z.array(
            z.object({
                id: z.string(),
                text: z.string()
            })
        ).min(1, { message: "Debes ingresar al menos una palabra clave." }),
        isSensitiveContent: z.boolean(),
        video: z.instanceof(File, { message: "Debes subir un video" })
            .refine(file => file.size <= maxSize, {
                message: `El archivo debe pesar menos de ${formatBytes(maxSize)}.`
            })
            .refine(file => ["video/mp4", "video/webm", "video/ogg", "video/quicktime"].includes(file.type), {
                message: "Formato no soportado."
            })
    });
}

/**
 * Renders the video upload form with validation, preview, and two-phase upload logic.
 * Uses react-hook-form and Zod for validation.
 * Collects video file, title, description, category, keywords, and sensitive content flag.
 * Sends metadata and file hash to backend for validation and Cloudinary credentials.
 * Uploads video directly to Cloudinary with progress tracking.
 * Shows upload progress, handles errors, and navigates on success.
 */
export default function VideoUploadForm({ plan }: { plan: keyof typeof MAX_FILE_SIZE_BY_PLAN }) {
    const navigate = useNavigate();
    const form = useForm<z.infer<ReturnType<typeof createFormSchema>>>({
        resolver: zodResolver(createFormSchema(plan)),
        mode: "onChange",
        defaultValues: {
            keywords: [],
            isSensitiveContent: false
        }
    });
    const [tags, setTags] = React.useState<Tag[]>([]);
    const { setValue } = form;
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
    const [file, setFile] = useState<File>();
    const [src, setSrc] = useState<{ src: string; type: string } | null>(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("");

    const handleUploadBtn = () => {
        document.getElementById("video")?.click();
    };

    useEffect(() => {
        if (!file) return;

        const fileURL = URL.createObjectURL(file);
        const ext = file.name.split(".").pop()?.toLowerCase();

        let type = "";
        switch (ext) {
            case "mp4":
                type = "video/mp4";
                break;
            case "webm":
                type = "video/webm";
                break;
            case "ogg":
                type = "video/ogg";
                break;
            case "mov":
                type = "video/quicktime";
                break;
            default:
                type = "video/mp4"; // fallback
        }

        setSrc({ src: fileURL, type });

        return () => {
            URL.revokeObjectURL(fileURL);
            setSrc(null);
        };
    }, [file]);

    useEffect(() => {
        if (!src || !videoRef.current) return;

        if (!playerRef.current) {
            playerRef.current = videojs(videoRef.current, {
                controls: true,
                sources: [src]
            });
        } else {
            playerRef.current.src(src);
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [src]);

    const handleSubmit = async (values: z.infer<ReturnType<typeof createFormSchema>>) => {
        const keywords = values.keywords.map(keyword => keyword.text);

        const hash = await calculateHash(values.video);
        const size = values.video.size;
        const videoData = {
            title: values.title,
            description: values.description,
            category: values.category,
            keywords: JSON.stringify(keywords),
            isSensitiveContent: JSON.stringify(values.isSensitiveContent),
            hash,
            size
        }

        await upload(videoData, values.video);
    }

    const upload = async (videoData: any, video: File) => {
        const token = localStorage.getItem("token");

        setStatus("Cargando...");
        try {
            const res = await fetch(API_URL + "/users/me/videos", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(videoData)
            });

            const data = await res.json();
            if (data.error) {
                if (res.status == 401 || res.status == 404) {
                    localStorage.clear();
                    toast("Tu sesión ha expirado.")
                    navigate("/");
                } else {
                    form.setError("root", { message: data.error });
                }
                setStatus("");
            } else if (res.status == 201) {
                const { signature, timestamp, cloudName, apiKey, publicId } = data;

                const formData = new FormData();
                formData.append("file", video);
                formData.append("api_key", apiKey);
                formData.append("timestamp", timestamp);
                formData.append("signature", signature);
                formData.append("public_id", publicId);
                formData.append("folder", "videos");
                formData.append("type", "private");

                setStatus("Subiendo...");
                await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, formData, {
                    onUploadProgress: (event) => {
                        const percent = Math.round((event.loaded * 100) / event.total!);
                        setProgress(percent);
                    }
                });

                localStorage.setItem("msg", "¡Tu video se subió correctamente!");
                navigate("/mi-coleccion");
                navigate(0);
            }
        } catch (e: any) {
            form.setError("root", { message: "Ha ocurrido un error inesperado." });
            setStatus("");
        }
    }

    return (
        <div className="p-3">
            <div className="mb-4">
                <h1 className="text-2xl font-semibold mb-2">Subir video</h1>
                <p className="text-sm text-muted-foreground">
                    Sube el archivo e ingresa la información de tu video
                </p>
            </div>
            <Separator className="mb-4" />
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="grid gap-12 lg:grid-cols-2"
                >
                    <div className="flex flex-col gap-5">
                        <FormField
                            control={form.control}
                            name="video"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="video">Archivo de video</FormLabel>
                                    <FormControl>
                                        <div>
                                            <Input
                                                id="video"
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => {
                                                    setSrc(null);
                                                    const file = e.target.files?.[0];
                                                    field.onChange(file);
                                                    setFile(file);
                                                }}
                                            />
                                            <Button
                                                variant="outline"
                                                onClick={handleUploadBtn}
                                                className="w-full justify-start"
                                            >
                                                <UploadIcon />
                                                Selecciona un archivo
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Por favor, sube un archivo de video con alguna de estas extensiones: .mp4, .webm, .ogg, .mov.
                                    </FormDescription>
                                    <FormDescription className="text-xs">
                                        El tamaño máximo permitido es de {formatBytes(MAX_FILE_SIZE_BY_PLAN[plan])}.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {src && (
                            <>
                                <h2 className="text-lg font-semibold">Vista previa del video</h2>
                                <div className="h-52">
                                    <video ref={videoRef} className="video-js vjs-fill" />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex flex-col gap-5">
                        <h2 className="text-xl font-semibold">Información del video</h2>
                        <Separator />
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel htmlFor="title">Título</FormLabel>
                                        <p className="text-xs text-muted-foreground">
                                            {field.value ? field.value.length : 0}/60
                                        </p>
                                    </div>
                                    <FormControl>
                                        <Input
                                            id="title"
                                            type="text"
                                            placeholder="Título de ejemplo"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel htmlFor="description">Descripción</FormLabel>
                                        <p className="text-xs text-muted-foreground">
                                            {field.value ? field.value.length : 0}/500
                                        </p>
                                    </div>
                                    <FormControl>
                                        <Textarea
                                            id="description"
                                            placeholder="Descripción de ejemplo"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="category">Categoría</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger id="category">
                                                <SelectValue placeholder="Selecciona una categoría" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {videoCategories.map(category => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="keywords"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="keywords">Palabras clave</FormLabel>
                                    <FormControl>
                                        <TagInput
                                            id="keywords"
                                            activeTagIndex={null} setActiveTagIndex={() => { }} {...field}
                                            placeholder="Ingresa una palabra clave"
                                            tags={tags}
                                            setTags={(newTags) => {
                                                setTags(newTags);
                                                setValue("keywords", newTags as [Tag, ...Tag[]], { shouldValidate: true });
                                            }}
                                            minLength={2}
                                            maxLength={20}
                                            maxTags={10}
                                            placeholderWhenFull="No puedes agregar más"
                                            className="text-lg"
                                            styleClasses={{
                                                inlineTagsContainer: "bg-transparent dark:bg-input/30",
                                                input: "shadow-none text-base md:text-sm"
                                            }}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Ingresa entre 1 y 10 palabras clave, separadas por ",". Estas palabras clave ayudan a que los usuarios encuentren tu video.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isSensitiveContent"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center space-x-2">
                                        <FormControl>
                                            <Checkbox
                                                id="isSensitiveContent"
                                                checked={field.value ? true : false}
                                                onCheckedChange={(checked) => field.onChange(checked)}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                                name={field.name}
                                            />
                                        </FormControl>
                                        <FormLabel htmlFor="isSensitiveContent" className="font-normal">
                                            Este video contiene contenido sensible (desnudos, armas, violencia, etc.)
                                        </FormLabel>
                                    </div>
                                    <FormDescription className="text-xs">
                                        Esta opción puede activarse automáticamente tras subir el video si nuestro sistema detecta contenido sensible.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {form.formState.isSubmitting && (
                            <div className="flex items-center bg-muted rounded-lg p-2 gap-4">
                                <p className="text-sm font-semibold">{status}</p>
                                <Progress value={progress} />
                            </div>
                        )}
                        {form.formState.errors.root && (
                            <FormMessage>
                                {form.formState.errors.root.message}
                            </FormMessage>
                        )}
                        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                            Subir
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
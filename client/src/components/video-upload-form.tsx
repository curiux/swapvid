import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import Spinner from "./spinner";
import { Button } from "./ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Tag, TagInput } from "emblor";
import React, { useEffect, useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { Separator } from "./ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { videoCategories } from "@/lib/utils";
import { UploadIcon } from "lucide-react";


/**
 * This schema defines validation rules for the video upload form using Zod.
 * - title: Required, 5-60 characters.
 * - description: Required, 10-500 characters.
 * - category: Required string (must select a category).
 * - keywords: Required array of at least 1 tag object ({id, text}).
 * - video: Required File, max 500MB, must be a supported video format (mp4, webm, ogg, mov).
 */
const formSchema = z.object({
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
    video: z.instanceof(File, { message: "Debes subir un video" })
        .refine(file => file.size <= 500 * 1024 * 1024, { message: "El archivo debe pesar menos de 500MB." })
        .refine(file => ["video/mp4", "video/webm", "video/ogg", "video/quicktime"].includes(file.type), { message: "Formato no soportado." })
});

/**
 * This component renders the video upload form.
 * It uses react-hook-form with Zod validation to handle form state and validation.
 * The form collects video file, title, description, category, and keywords.
 * On submit, it will eventually upload the video and metadata to the server.
 */
export default function VideoUploadForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            keywords: []
        }
    });
    const [tags, setTags] = React.useState<Tag[]>([]);
    const { setValue } = form;
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
    const [file, setFile] = useState<File>();
    const [src, setSrc] = useState<{ src: string; type: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleUploadBtn = () => {
        fileInputRef.current?.click();
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

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        console.log(values)

        await upload();
    }

    const upload = () => {

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
                    className="grid gap-12 md:grid-cols-2"
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
                                                ref={fileInputRef}
                                                onChange={(e) => {
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
                                        El tamaño máximo permitido es de 500 MB.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {src && (
                            <>
                                <h2 className="text-lg font-semibold">Vista previa del video</h2>
                                <div className="h-full min-h-52">
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
                                            <SelectTrigger>
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
                                                setValue("keywords", newTags as [Tag, ...Tag[]]);
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
                        {form.formState.isSubmitting && <Spinner className="w-8 h-8" />}
                        {form.formState.errors.root && (
                            <FormMessage>
                                {form.formState.errors.root.message}
                            </FormMessage>
                        )}
                        <Button type="submit" className="w-full">
                            Subir
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
import { z } from "zod";
import { Card, CardContent } from "../ui/card";
import { useLocation, useNavigate } from "react-router";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Spinner from "../spinner";
import { useEffect, useState } from "react";
import { Checkbox } from "../ui/checkbox";
import { TagInput, type Tag } from "emblor";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { API_URL, videoCategories } from "@/lib/utils";
import { useVideoStore } from "@/lib/store";
import { formSchema as videoSchema } from "./video-upload-form";
import { DialogClose } from "../ui/dialog";

const formSchema = videoSchema.omit({ video: true });

/**
 * EditVideoForm component
 * - Renders a form for editing video information (title, description, category, keywords, sensitive content flag).
 * - Uses react-hook-form and Zod for validation, and updates only changed fields.
 * - Submits changes to the backend and handles navigation and error states.
 * - Used inside a dialog for editing an existing video.
 */
export default function EditVideoForm() {
    const navigate = useNavigate();
    const location = useLocation()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            keywords: [],
            isSensitiveContent: false
        }
    });
    const [tags, setTags] = useState<Tag[]>([]);
    const { setValue } = form;
    const originalVideo = useVideoStore(state => state.video);

    useEffect(() => {
        if (originalVideo) {
            setValue("title", originalVideo.title);
            setValue("description", originalVideo.description);
            setValue("category", originalVideo.category);

            setTags([]);
            setValue("keywords", []);
            const keywords = originalVideo.keywords.map((keyword) => {
                const id = crypto.getRandomValues(new Uint32Array(1))[0].toString();
                return { id, text: keyword };
            });
            setTags(keywords);
            setValue("keywords", keywords as Tag[]);

            setValue("isSensitiveContent", originalVideo.isSensitiveContent);
        }
    }, [originalVideo]);

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        const dataChanged: any = {};
        if (values.title != originalVideo?.title)
            dataChanged.title = values.title;

        if (values.description != originalVideo?.description)
            dataChanged.description = values.description;

        if (values.category != originalVideo?.category)
            dataChanged.category = values.category;

        const keywords = values.keywords.map(keyword => keyword.text);
        if (JSON.stringify(keywords) != JSON.stringify(originalVideo?.keywords))
            dataChanged.keywords = JSON.stringify(keywords);

        if (JSON.stringify(values.isSensitiveContent) != JSON.stringify(originalVideo?.isSensitiveContent))
            dataChanged.isSensitiveContent = JSON.stringify(values.isSensitiveContent);

        await upload(dataChanged);
    }

    const upload = async (dataChanged: any) => {
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(API_URL + "/videos/" + originalVideo?._id, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    data: dataChanged
                })
            });

            const data = await res.json();
            if (data.error) {
                if (res.status == 401 || res.status == 404) {
                    localStorage.clear();
                    navigate("/");
                } else {
                    form.setError("root", { message: data.error });
                }
            } else if (res.status == 200) {
                navigate(location.pathname.split("/editar")[0]);
            }
        } catch (e) {
            form.setError("root", { message: "Ha ocurrido un error inesperado." });
        }
    }

    return (
        <Card>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
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
                                    <Select onValueChange={field.onChange} value={field.value}>
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
                        {form.formState.isSubmitting && <Spinner className="w-8 h-8" />}
                        {form.formState.errors.root && (
                            <FormMessage>
                                {form.formState.errors.root.message}
                            </FormMessage>
                        )}
                        <div className="grid gap-3 md:grid-cols-2">
                            <Button type="submit" aria-label="Editar">
                                Editar
                            </Button>
                            <DialogClose>
                                <Button variant="outline" className="w-full" aria-label="Cancelar">Cancelar</Button>
                            </DialogClose>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
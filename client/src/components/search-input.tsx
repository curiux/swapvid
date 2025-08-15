import { ListFilter, SearchIcon, StepForward } from "lucide-react";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { videoCategories } from "@/lib/utils";
import { Checkbox } from "./ui/checkbox";

/**
 * SearchInput component
 * - Renders a search input field, an optional filters dialog, and a button for navigating to the search results page.
 * - Updates the query state as the user types.
 * - Navigates to `/buscar?q=<query>` on Enter key or button click.
 * - If filters are enabled, displays a dialog for filtering by category, upload date order, and sensitive content.
 * - Uses React Router for navigation and state management.
 */
export default function SearchInput({ filters }: { filters: boolean }) {
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    const [query, setQuery] = useState("");

    useEffect(() => {
        setQuery(params.get("q") || "");
    }, []);

    useEffect(() => {
        if (filters) {
            const truncatedQuery = query.length > 60 ? query.slice(0, 60) : query;
            document.title = (truncatedQuery || "Buscar") + " – SwapVid";
        }
    }, [params.get("q")]);

    return (
        <div className="max-w-lg w-full flex items-center gap-2 px-2">
            {filters && (
                <Filters />
            )}
            <div className="w-full flex h-10 items-center rounded-md border border-input bg-white pl-3 text-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2 dark:bg-input/30" >
                <SearchIcon className="h-[16px] w-[16px]" />
                <input
                    type="search"
                    placeholder={!filters ? "Explorá historias, ideas y creaciones..." : ""}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key == "Enter" && navigate(`/buscar?q=${query}`)}
                    className="w-full p-2 placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>
            <Button asChild variant="outline" className="h-10 cursor-pointer" data-testid="searchbtn">
                <Link to={`/buscar?q=${query}`}>
                    <StepForward />
                </Link>
            </Button>
        </div>
    );
}

/**
 * formSchema
 * - Zod schema for validating the search filters form.
 * - category: Optional string for video category filter.
 * - uploadedDateOrder: Optional string for sorting by upload date.
 * - sensitiveContent: Boolean flag to include sensitive content in results.
 * - Used by react-hook-form for validation and default values in Filters.
 */
const formSchema = z.object({
    category: z.string().optional(),
    uploadedDateOrder: z.string().optional(),
    sensitiveContent: z.boolean()
});

/**
 * Filters component
 * - Renders a dialog for advanced search filters: category, upload date order, and sensitive content.
 * - Uses react-hook-form and Zod for validation and state management.
 * - Syncs filter state with URL query parameters and updates navigation on submit or reset.
 * - Provides UI for selecting filters and applying or clearing them.
 */
function Filters() {
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            sensitiveContent: false
        }
    });
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (params.get("category")) form.setValue("category", params.get("category")!);
        if (params.get("order")) form.setValue("uploadedDateOrder", params.get("order")!);
        if (params.get("sensitive")) form.setValue("sensitiveContent", JSON.parse(params.get("sensitive")!));
    }, [params.get("q"), params.get("category"), params.get("order"), params.get("sensitive")]);

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        const category = values.category;
        const uploadedDateOrder = values.uploadedDateOrder;
        const sensitiveContent = values.sensitiveContent;

        let query = "?q=" + params.get("q") || "";

        if (category && category != "all") query += "&category=" + category;
        if (uploadedDateOrder) query += "&order=" + uploadedDateOrder;
        query += "&sensitive=" + sensitiveContent;

        if (params.get("page")) query += "&page=" + params.get("page");

        navigate("/buscar" + query);
        setOpen(false);
    }

    const handleReset = () => {
        let query = "?q=" + params.get("q") || "";
        if (params.get("page")) query += "&page=" + params.get("page");

        navigate("/buscar" + query);
        setOpen(false);
        form.reset();
    }

    return (
        <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-10">
                    <ListFilter />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)}>
                        <DialogHeader>
                            <DialogTitle>Filtrar búsqueda</DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-col gap-5 my-5">
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
                                                <SelectItem value="all">
                                                    (Todas)
                                                </SelectItem>
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
                                name="uploadedDateOrder"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="uploadedDateOrder">Ordenar por fecha de subida</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger id="uploadedDateOrder">
                                                    <SelectValue placeholder="Selecciona un orden" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="newFirst">
                                                    Más recientes primero
                                                </SelectItem>
                                                <SelectItem value="oldFirst">
                                                    Más antiguos primero
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="sensitiveContent"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center space-x-2">
                                            <FormControl>
                                                <Checkbox
                                                    id="sensitiveContent"
                                                    checked={field.value ? true : false}
                                                    onCheckedChange={(checked) => field.onChange(checked)}
                                                    onBlur={field.onBlur}
                                                    ref={field.ref}
                                                    name={field.name}
                                                />
                                            </FormControl>
                                            <FormLabel htmlFor="sensitiveContent" className="font-normal text-xs">
                                                Incluir contenido sensible (desnudos, armas, violencia, etc.)
                                            </FormLabel>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="secondary" className="w-full mt-2 mr-auto md:w-auto md:mt-0" onClick={handleReset}>
                                Borrar filtros
                            </Button>
                            <DialogClose asChild>
                                <Button variant="outline" aria-label="Volver">Volver</Button>
                            </DialogClose>
                            <Button type="submit">
                                Filtrar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
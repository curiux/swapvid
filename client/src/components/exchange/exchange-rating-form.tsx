import type { Exchange } from "@/lib/types";
import { API_URL } from "@/lib/utils";
import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate, useParams } from "react-router";
import Spinner from "../spinner";
import { Card, CardContent } from "../ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { DialogClose } from "../ui/dialog";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";

const formSchema = z.object({
    rating: z.number(),
    comment: z.string()
        .max(500, { message: "El comentario no debe superar los 500 caracteres." })
        .refine(val => val.length === 0 || val.length >= 10, {
            message: "Debe tener al menos 10 caracteres o dejarse vacío",
        })
});

export default function ExchangeRatingForm() {
    const navigate = useNavigate();
    const params = useParams();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            rating: 0
        }
    });
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
                if (exchange.status != "accepted") {
                    navigate("/mi-coleccion/intercambios");
                }
                setExchangeData(exchange);
                setLoading(false);


            }
        } catch (e) {
            navigate("/error");
        }
    }

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        console.log(values);
    }

    if (loading) return (
        <Spinner className="w-14 h-14" />
    );

    return (
        <Card>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
                        <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-2">
                                        <FormLabel htmlFor="title">Calificación</FormLabel>
                                        <p className="text-xs text-muted-foreground">
                                            {field.value}/5
                                        </p>
                                    </div>
                                    <FormControl>
                                        <StarRating rating={field.value} onChange={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="comment"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel htmlFor="description">Comentario (opcional)</FormLabel>
                                        <p className="text-xs text-muted-foreground">
                                            {field.value ? field.value.length : 0}/500
                                        </p>
                                    </div>
                                    <FormControl>
                                        <Textarea
                                            id="description"
                                            placeholder="Comentario de ejemplo"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
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
                                Calificar
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

const StarRating = ({ rating = 3.5, onChange }: { rating: number, onChange: (value: number) => void }) => {
    const [currentRating, setCurrentRating] = useState(rating);
    const max = 5;

    const handleClick = (e: any, index: number) => {
        const { left, width } = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - left;
        const isHalf = clickX < width / 2;

        const newRating = index === 1 ? 1 : (isHalf ? index - 0.5 : index);

        setCurrentRating(newRating);
        onChange(newRating);
    };

    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: max }).map((_, i) => {
                const index = i + 1;
                const value = currentRating;

                return (
                    <div
                        key={index}
                        className="relative w-8 h-8 cursor-pointer"
                        onClick={(e) => handleClick(e, index)}
                    >
                        {value >= index ? (
                            <FullStar />
                        ) : value >= index - 0.5 ? (
                            <HalfStar />
                        ) : (
                            <EmptyStar />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const FullStar = () => (
    <svg className="w-8 h-8 text-yellow-300" fill="currentColor" viewBox="0 0 22 20">
        <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
    </svg>
);

const HalfStar = () => (
    <svg
        className="w-8 h-8 text-gray-300 dark:text-gray-500"
        viewBox="0 0 22 20"
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <clipPath id="half-clip">
                <rect x="0" y="0" width="11" height="20" />
            </clipPath>
        </defs>

        {/* Gray background */}
        <path
            d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
            fill="currentColor"
        />

        {/* Left side */}
        <path
            d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
            fill="oklch(90.5% 0.182 98.111)"
            clipPath="url(#half-clip)"
        />
    </svg>
);

const EmptyStar = () => (
    <svg className="w-8 h-8 text-gray-300 dark:text-gray-500" fill="currentColor" viewBox="0 0 22 20">
        <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
    </svg>
);
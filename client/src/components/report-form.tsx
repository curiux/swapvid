import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { API_URL, reportReasons } from "@/lib/utils";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import Spinner from "./spinner";

/**
 * Zod schema for the report form validation.
 * - reason: Required string, must select a reason.
 * - otherReason: Optional string, up to 100 characters, required if reason is 'other'.
 * - details: Optional string, up to 500 characters, for additional information.
 */
const formSchema = z.object({
    reason: z.string({
        required_error: "Debes seleccionar una razón."
    }),
    otherReason: z.string()
        .max(100, { message: "La razón del reporte no debe superar los 100 caracteres" })
        .optional(),
    details: z.string({})
        .max(500, { message: "Los detalles adicionales no deben superar los 500 caracteres" })
        .optional()
});

/**
 * ReportForm component
 * - Renders a dialog form for reporting a video (select reason, add details, etc.).
 * - Uses react-hook-form and Zod for validation.
 * - Handles authentication, form submission, and error states.
 * - Submits the report to the backend and provides user feedback.
 * - Used as a modal dialog for reporting a specific video.
 */
export default function ReportForm({ videoId, openChange }: { videoId: string, openChange: () => void }) {
    const navigate = useNavigate();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange"
    });
    const [reason, setReason] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast("Inicia sesión para realizar un reporte.");
            navigate("/login");
        }
    }, []);

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        const reason = values.reason;

        if (values.reason == "other" && !values.otherReason) {
            form.setError("otherReason", {
                message: "Debes escribir una razón"
            });
            return;
        }
        const otherReason = values.otherReason;

        const details = values.details;

        await sendReport(reason!, otherReason, details);
    }

    const sendReport = async (reason: string, otherReason: string | undefined, details: string | undefined) => {
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(API_URL + "/videos/" + videoId + "/report", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    reason,
                    otherReason,
                    details,
                    videoId
                })
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
            } else if (res.status == 201) {
                toast("¡Reporte enviado! Lo revisaremos lo antes posible.");
                openChange();
            }
        } catch (e) {
            form.setError("root", { message: "Ha ocurrido un error inesperado." });
        }
    }

    return (
        <Dialog defaultOpen={true} onOpenChange={openChange}>
            <DialogContent className="min-w-1/2 max-w-full max-h-screen overflow-y-auto sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Reportar video</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="reason">Razón del reporte</FormLabel>
                                    <Select onValueChange={(value) => {
                                        field.onChange(value);
                                        setReason(value);
                                    }} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger id="reason">
                                                <SelectValue placeholder="Selecciona una razón" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {reportReasons.map(reason => (
                                                <SelectItem key={reason.id} value={reason.id}>
                                                    {reason.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {reason == "other" && (
                            <FormField
                                control={form.control}
                                name="otherReason"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel htmlFor="title">Razón</FormLabel>
                                            <p className="text-xs text-muted-foreground">
                                                {field.value ? field.value.length : 0}/100
                                            </p>
                                        </div>
                                        <FormControl>
                                            <Input
                                                id="title"
                                                type="text"
                                                placeholder="Razón de ejemplo"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <FormField
                            control={form.control}
                            name="details"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel htmlFor="details">Detalles adicionales (opcional)</FormLabel>
                                        <p className="text-xs text-muted-foreground">
                                            {field.value ? field.value.length : 0}/500
                                        </p>
                                    </div>
                                    <FormControl>
                                        <Textarea
                                            id="details"
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
                        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                            Reportar
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
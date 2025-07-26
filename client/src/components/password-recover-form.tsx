import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Spinner from "./spinner";
import { API_URL } from "@/lib/utils";
import { useNavigate } from "react-router";
import { toast } from "sonner";

/**
 * This schema defines validation rules for the password recovery form using Zod.
 * - email: Required.
 */
const formSchema = z.object({
    email: z.string({
        required_error: "Ingresa un email."
    })
});

/*
 * This component renders the password recovery form.
 * - Uses react-hook-form with Zod validation for form state and validation.
 * - Collects the user's email to send password recovery instructions.
 * - Displays errors using FormMessage and shows a spinner while submitting.
 * - On success, shows a toast and redirects to the login page.
 */
export default function PasswordRecoverForm() {
    const navigate = useNavigate();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange"
    });

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        const email = values.email;
        await sendPasswordRecovery(email);
    }

    const sendPasswordRecovery = async (email: string) => {
        try {
            const res = await fetch(API_URL + "/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            if (data.error) {
                form.setError("root", { message: data.error });
            } else {
                toast("Si la cuenta existe, se ha enviado un correo con instrucciones.");
                navigate("/login");
            }
        } catch (e) {
            form.setError("root", { message: "Ha ocurrido un error inesperado." });
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="email">Ingresa tu email</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="juan@ejemplo.com"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Si la cuenta existe, recibirás un correo con instrucciones para restablecer tu contraseña.
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
                            Recuperar contraseña
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
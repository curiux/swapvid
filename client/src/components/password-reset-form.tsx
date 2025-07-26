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
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * This schema defines validation rules for the password reset form using Zod.
 * - password1: Required, must be 8-32 characters, include uppercase, lowercase, number, and special character.
 * - password2: Required, no pattern (checked for match below).
 * The .refine() at the end ensures password1 and password2 match, showing an error on password2 if not.
 */
const formSchema = z.object({
    password1: z.string({
        required_error: "La contraseña es obligatoria."
    }).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,32}$/,
        { message: "La contraseña no cumple con los requisitos de seguridad." }
    ),
    password2: z.string({
        required_error: "Debes repetir la contraseña."
    })
}).refine((data) => data.password1 === data.password2, {
    message: "Las contraseñas no coinciden.",
    path: ["password2"],
});

/*
 * This component renders the password reset form.
 * - Uses react-hook-form with Zod validation for form state and validation.
 * - Collects new password and confirmation, with password visibility toggle.
 * - Displays errors using FormMessage and shows a spinner while submitting.
 * - On success, shows a toast and redirects to the login page.
 */
export default function PasswordResetForm() {
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange"
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleShowPassword = () => setShowPassword(lastState => !lastState);

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        const password = values.password1;
        await resetPassword(password);
    }

    const resetPassword = async (password: string) => {
        const token = params.get("token");

        try {
            const res = await fetch(API_URL + "/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ password, token })
            });

            const data = await res.json();
            if (data.error) {
                form.setError("root", { message: data.error });
            } else {
                toast("Contraseña cambiada correctamente.");
                navigate("/login");
            }
        } catch (e) {
            form.setError("root", { message: "Ha ocurrido un error inesperado." });
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Cambiar contraseña</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
                        <FormField
                            control={form.control}
                            name="password1"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="password1">Contraseña</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                id="password1"
                                                type={showPassword ? "text" : "password"}
                                                {...field}
                                            />
                                            <div
                                                onClick={handleShowPassword}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-4 h-4 text-gray-500" />
                                                ) : (
                                                    <Eye className="w-4 h-4 text-gray-500" />
                                                )}
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        La contraseña debe tener entre 8 y 32 caracteres, por lo menos una mayúscula y una minúscula,
                                        un número y un carácter especial.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password2"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="password2">Repite la contraseña</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="password2"
                                            type={showPassword ? "text" : "password"}
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
                        <Button type="submit" className="w-full">
                            Cambiar contraseña
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
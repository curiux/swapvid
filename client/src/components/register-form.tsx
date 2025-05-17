import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { Checkbox } from "./ui/checkbox";
import { API_URL } from "@/lib/utils";

/**
 * This schema defines validation rules for the registration form using Zod.
 * - email: Required, must match a standard email regex pattern.
 * - username: Required, must be 5-32 characters, only letters, numbers, and underscores.
 * - password1: Required, must be 8-32 characters, include uppercase, lowercase, number, and special character.
 * - password2: Required, no pattern (checked for match below).
 * - tac: Required boolean (must accept terms and conditions).
 * The .refine() at the end ensures password1 and password2 match, showing an error on password2 if not.
 */
const formSchema = z.object({
    email: z.string({
        required_error: "El email es obligatorio."
    }).regex(
        /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
        { message: "El email ingresado no es válido." }
    ),
    username: z.string({
        required_error: "El nombre de usuario es obligatorio."
    }).regex(
        /^[a-zA-Z0-9_]{5,32}$/,
        { message: "El nombre de usuario no es válido." }
    ),
    password1: z.string({
        required_error: "La contraseña es obligatoria."
    }).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,32}$/,
        { message: "La contraseña no cumple con los requisitos de seguridad." }
    ),
    password2: z.string({
        required_error: "Debes repetir la contraseña."
    }),
    tac: z.boolean({
        required_error: "Debes aceptar los términos y condiciones."
    })
}).refine((data) => data.password1 === data.password2, {
    message: "Las contraseñas no coinciden.",
    path: ["password2"],
});

/*
 * This component renders the user registration form.
 * It uses react-hook-form with Zod validation to handle form state and validation.
 * The form collects email, username, password, password confirmation, and terms acceptance.
 * On successful registration, it stores the authentication token and redirects to the home page.
 */
export default function RegisterForm() {
    const navigate = useNavigate();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange"
    });

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        const email = values.email;
        const username = values.username;
        const password = values.password1;
        
        register(email, username, password);
    }

    const register = async (email: string, username: string, password: string) => {
        const res = await fetch(API_URL + "/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                username,
                password
            })
        });

        const data = await res.json();
        if (data.error) {
            if (data.field) {
                form.setError(data.field as keyof z.infer<typeof formSchema>, { message: data.error });
            } else {
                form.setError("tac", { message: data.error });
            }
        } else {
            localStorage.setItem("token", data.token);
            navigate("/");
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Registro</CardTitle>
                <CardDescription>
                    Ingresa tus datos para crear una cuenta
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="email">Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="juan@ejemplo.com"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="username">Nombre de usuario</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder="juan123"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        El nombre de usuario solo puede contener letras, números y guiones bajos,
                                        y debe tener entre 5 y 32 caracteres.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password1"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="password1">Contraseña</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="password1"
                                            type="password"
                                            {...field}
                                        />
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
                                            type="password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tac"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center space-x-2">
                                        <FormControl>
                                            <Checkbox
                                                id="tac"
                                                checked={field.value ? true : false}
                                                onCheckedChange={(checked) => checked
                                                    ? field.onChange(true)
                                                    : field.onChange(undefined)
                                                }
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                                name={field.name}
                                            />
                                        </FormControl>
                                        <FormLabel htmlFor="tac">
                                            <div>
                                                Acepto los
                                                <Link to="/terminos-y-condiciones" className="ml-1 underline underline-offset-4">
                                                    términos y condiciones
                                                </Link>
                                            </div>
                                        </FormLabel>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">
                            Registrarse
                        </Button>
                    </form>
                </Form>
                <div className="mt-4 text-center text-sm">
                    ¿Ya tienes una cuenta?{" "}
                    <Link to="/login" className="underline underline-offset-4">
                        Inicia Sesión
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
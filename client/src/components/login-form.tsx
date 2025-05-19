import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Link, useNavigate } from "react-router";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { API_URL } from "@/lib/utils";

/**
 * This schema defines validation rules for the login form using Zod.
 * - user: Required, can be either an email or a username.
 * - password: Required.
 */
const formSchema = z.object({
    user: z.string({
        required_error: "Ingresa un email o nombre de usuario."
    }),
    password: z.string({
        required_error: "Ingresa una contraseña."
    })
});

/*
 * This component renders the user login form.
 * It uses react-hook-form with Zod validation to handle form state and validation.
 * The form collects either an email or username, and a password.
 * On successful login, it stores the authentication token and redirects to the home page.
 */
export default function LoginForm() {
    const navigate = useNavigate();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange"
    });

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        const user = values.user;
        const password = values.password;

        // If it has @ it's an email, if not username
        const payload: any = { password };
        if (user.includes("@")) {
            payload.email = user;
        } else {
            payload.username = user;
        }
        login(payload);
    }

    const login = async (payload: { email?: string; username?: string; password: string }) => {
        const res = await fetch(API_URL + "/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.error) {
            form.setError("password", { message: data.error });
        } else {
            localStorage.setItem("token", data.token);
            navigate("/");
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Inicio de Sesión</CardTitle>
                <CardDescription>
                    Ingresa tus datos para iniciar sesión
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
                        <FormField
                            control={form.control}
                            name="user"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="user">Email o Nombre de usuario</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="user"
                                            type="text"
                                            placeholder="juan@ejemplo.com o juan123"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="password">Contraseña</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="password"
                                            type="password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">
                            Entrar
                        </Button>
                    </form>
                </Form>
                <div className="mt-4 text-center text-sm">
                    ¿No tienes una cuenta?{" "}
                    <Link to="/registro" className="underline underline-offset-4">
                        Registrate ahora
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
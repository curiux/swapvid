import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Link } from "react-router";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"

const formSchema = z.object({
    email: z.string({
        required_error: "El email es obligatorio."
    }).email("El email ingresado no es válido."),
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
    })
}).refine((data) => data.password1 === data.password2, {
    message: "Las contraseñas no coinciden.",
    path: ["password2"],
});

export default function RegisterForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema)
    });

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        //const email = values.email;
        //const username = values.username;
        //const password = values.password1;
        console.log(values);
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
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-6">
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
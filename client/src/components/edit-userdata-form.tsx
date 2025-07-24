import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import Spinner from "./spinner";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import type { UserData } from "@/lib/types";
import { API_URL } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router";

/**
 * This schema defines validation rules for the user data edit form using Zod.
 * - email: Required, must match a standard email regex pattern.
 * - username: Required, must be 5-32 characters, only letters, numbers, and underscores.
 * - password1: Required, but allows empty string (no change). If provided, must be 8-32 characters, include uppercase, lowercase, number, and special character.
 * - password2: Optional, only checked if password1 is provided. Used to confirm password change.
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
        { message: "El nombre de usuario solo puede contener letras, números y guiones bajos, y debe tener entre 5 y 32 caracteres." }
    ),
    password1: z.string({
        required_error: "La contraseña es obligatoria."
    }).refine(
        (val) =>
            val === "" || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,32}$/.test(val),
        {
            message: "La contraseña debe tener entre 8 y 32 caracteres, por lo menos una mayúscula y una minúscula, un número y un carácter especial.",
        }
    ),
    password2: z.string().optional()
}).refine((data) => data.password1 === data.password2, {
    message: "Las contraseñas no coinciden.",
    path: ["password2"],
});

/**
 * This component renders the user data edit form.
 * It uses react-hook-form with Zod validation to handle form state and validation.
 * The form allows editing email, username, and password, with validation and error handling.
 * On successful update, it calls getUserData and shows a success toast.
 * Handles session expiration and backend errors gracefully.
 */
export default function EditUserDataForm({ userData, getUserData }:
    { userData: UserData, getUserData: (token: string) => void }) {
    const navigate = useNavigate();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange"
    });
    const [edit, setEdit] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!edit) {
            form.clearErrors();
            form.setValue("email", userData.email);
            form.setValue("username", userData.username);
            form.setValue("password1", "");
            form.setValue("password2", "");
        }
    }, [edit]);

    useEffect(() => {
        setEdit(false);
    }, [userData]);

    const handleShowPassword = () => setShowPassword(lastState => !lastState);

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        const email = values.email;
        const username = values.username;
        const password = values.password1;

        if (email == userData.email && username == userData.username && !password) {
            setEdit(false);
            return;
        }
        await update(email, username, password);
    }

    const update = async (email: string, username: string, password: string) => {
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(API_URL + "/users/me", {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
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
                if (res.status == 401 || res.status == 404) {
                    localStorage.clear();
                    toast("Tu sesión ha expirado.")
                    navigate("/");
                } else {
                    form.setError("root", { message: data.error });
                }
            } else {
                getUserData(token!);
                toast.success("Tus datos han sido modificados correctamente.");
            }
        } catch (e) {
            form.setError("root", { message: "Ha ocurrido un error inesperado." });
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Datos personales</CardTitle>
                <CardDescription>
                    Visualiza o edita tus datos personales.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="grid grid-cols-2 items-center gap-5">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="col-span-2 md:col-span-1">
                                    <FormLabel htmlFor="email">Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="juan@ejemplo.com"
                                            disabled={!edit}
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem className="col-span-2 md:col-span-1">
                                    <FormLabel htmlFor="username">Nombre de usuario</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder="juan123"
                                            disabled={!edit}
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password1"
                            render={({ field }) => (
                                <FormItem className={`col-span-2 ${edit ? "md:col-span-1" : ""}`}>
                                    <FormLabel htmlFor="password1">Contraseña</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="password1"
                                            type={showPassword ? "text" : "password"}
                                            placeholder={edit ? "" : "********"}
                                            disabled={!edit}
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        {edit && (
                            <FormField
                                control={form.control}
                                name="password2"
                                render={({ field }) => (
                                    <FormItem className="col-span-2 md:col-span-1">
                                        <FormLabel htmlFor="password2">Repite la contraseña</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    id="password2"
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
                                    </FormItem>
                                )}
                            />
                        )}
                        {edit ? (
                            <>
                                <Button type="submit" className="w-full" aria-label="Guardar cambios">
                                    Guardar cambios
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => setEdit(false)} aria-label="Cancelar">
                                    Cancelar
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline" className="w-full col-span-2" onClick={() => setEdit(true)} aria-label="Editar datos">
                                Editar datos
                            </Button>
                        )}
                        <div className="col-span-2">
                            {form.formState.errors && (
                                <>
                                    {form.formState.errors.root && <FormMessage>- {form.formState.errors.root.message}</FormMessage>}
                                    {form.formState.errors.email && <FormMessage>- {form.formState.errors.email.message}</FormMessage>}
                                    {form.formState.errors.username && <FormMessage>- {form.formState.errors.username.message}</FormMessage>}
                                    {form.formState.errors.password1 && <FormMessage>- {form.formState.errors.password1.message}</FormMessage>}
                                    {form.formState.errors.password2 && <FormMessage>- {form.formState.errors.password2.message}</FormMessage>}
                                </>
                            )}
                            {form.formState.isSubmitting && <Spinner className="w-8 h-8" />}
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
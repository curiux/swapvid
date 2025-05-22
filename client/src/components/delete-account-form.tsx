import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { API_URL } from "@/lib/utils";
import Spinner from "./spinner";
import { useState } from "react";

/**
 * This schema defines validation rules for the delete account form using Zod.
 * - user: Required, must be the username to confirm account deletion.
 */
const formSchema = z.object({
    user: z.string({
        required_error: "Ingresa tu nombre de usuario."
    }),
});

/**
 * This component renders the delete account form.
 * - Uses react-hook-form with Zod validation to handle form state and validation.
 * - Prompts the user to confirm account deletion by entering the username.
 * - On successful deletion, clears local storage and displays a confirmation message.
 * - Shows errors as appropriate.
 */
export default function DeleteAccountForm({ username }: { username: string }) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange"
    });
    const [deleted, setDeleted] = useState(false);

    const handleSubmit = async () => {
        await deleteUser();
    }

    const deleteUser = async () => {
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(API_URL + "/users/me", {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (res.status == 200) {
                setDeleted(true);
                localStorage.clear();
            } else if (data.error) {
                if (res.status == 401 || res.status == 404) {
                    form.setError("root", { message: data.error });
                } else {
                    throw new Error();
                }
            }
        } catch (e) {
            form.setError("root", { message: "Ha ocurrido un error inesperado." });
        }
    }

    if (deleted) {
        return (
            <Card className="w-full max-w-md text-center py-10 px-6 shadow-lg">
                <p className="text-lg text-destructive-foreground mb-1">Tu cuenta y todos tus datos han sido eliminados permanentemente.</p>
                <p className="text-sm text-muted-foreground">Gracias por haber sido parte de nuestra comunidad. Si cambias de opinión, siempre serás bienvenido de vuelta.</p>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Eliminar Cuenta</CardTitle>
                <CardDescription className="text-destructive">
                    Esta acción eliminará permanentermente al usuario <span className="font-bold">{username}</span> junto a todos sus datos
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
                                    <FormLabel htmlFor="user">Ingresa tu usuario para confirmar</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="user"
                                            type="text"
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
                        <Button type="submit" variant="destructive" className="w-full cursor-pointer"
                            disabled={form.watch("user") !== username}
                        >
                            Eliminar
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
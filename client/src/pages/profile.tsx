import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router";

/**
 * This component renders the account profile page.
 * It displays an option to delete the user's account, with a button that navigates to the delete account page.
 */
export default function Profile() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-3 md:p-10">
            <div className="flex flex-col gap-3 w-full max-w-lg">
                <h1 className="text-3xl">Mi perfil</h1>
                <Separator />
                <div className="w-full max-w-lg flex items-center justify-between">
                    <p className="text-lg text-destructive">Eliminar cuenta</p>
                    <Button asChild variant="destructive">
                        <Link to="/eliminar-cuenta">Eliminar</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
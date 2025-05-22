import { Button } from "@/components/ui/button";
import { Link } from "react-router";

/**
 * This component renders the account settings page.
 * It displays an option to delete the user's account, with a button that navigates to the delete account page.
 */
export default function AccountSettings() {
    return (
        <div className="flex flex-col w-full p-4">
            <div className="w-full max-w-lg flex items-center justify-between">
                <p className="text-lg text-destructive">Eliminar cuenta</p>
                <Button asChild variant="destructive">
                    <Link to="/eliminar-cuenta">Eliminar</Link>
                </Button>
            </div>
        </div>
    );
}
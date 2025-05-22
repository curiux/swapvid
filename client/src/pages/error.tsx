import { useLocation } from "react-router";
import { Card } from "@/components/ui/card";

/**
 * This component renders the error page.
 * It displays an error message passed via the "msg" query parameter in the URL.
 * If no message is provided, a default error message is shown.
 */
export default function Error() {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const errorMsg = params.get("msg") || "Ha ocurrido un error inesperado.";

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-3 md:p-10 bg-muted">
            <Card className="w-full max-w-md text-center py-10 px-6 shadow-lg">
                <h1 className="text-3xl font-bold mb-4 text-destructive">¡Error!</h1>
                <p className="text-lg text-destructive-foreground mb-2">{errorMsg}</p>
                <p className="text-sm text-muted-foreground">Por favor, intenta nuevamente o contacta soporte si el problema persiste.</p>
            </Card>
        </div>
    );
}
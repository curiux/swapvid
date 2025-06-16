import ExchangeList from "@/components/exchange/exchange-list";
import { useEffect } from "react";
import { toast, Toaster } from "sonner";

/**
 * MyExchanges page
 * Displays the user's exchanges, showing notifications for recent actions.
 * Uses the ExchangeList component to render all exchanges.
 */
export default function MyExchanges() {

    useEffect(() => {
        const msg = localStorage.getItem("msg");
        if (msg) {
            toast.success(msg);
            localStorage.removeItem("msg");
        }
    }, []);

    return (
        <div className="flex items-center justify-center p-5">
            <Toaster position="top-center" />
            <div className="max-w-xl w-full">
                <h1 className="text-2xl text-center font-semibold mb-4">Intercambios</h1>
                <ExchangeList />
            </div>
        </div>
    );
}
import { useEffect } from "react";
import { toast, Toaster } from "sonner";

export default function MyExchanges() {

    useEffect(() => {
        const msg = localStorage.getItem("msg");
        if (msg) {
            toast.success(msg);
            localStorage.removeItem("msg");
        }
    }, []);

    return (
        <>
            <Toaster position="top-center" />
        </>
    );
}
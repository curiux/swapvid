import ExchangeRatingForm from "@/components/exchange/exchange-rating-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation, useNavigate } from "react-router";

export default function Rating() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            navigate(location.pathname.split("/calificar")[0]);
        }
    }

    return (
        <Dialog defaultOpen={true} onOpenChange={handleOpenChange}>
            <DialogContent className="min-w-1/2 max-w-full max-h-screen overflow-y-auto sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Calificar</DialogTitle>
                    <DialogDescription>
                        ¿Cómo calificarías el intercambio y contenido del video? ¿Recibiste lo que esperabas?
                    </DialogDescription>
                </DialogHeader>
                <ExchangeRatingForm />
            </DialogContent>
        </Dialog>
    );
}
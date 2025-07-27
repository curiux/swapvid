import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function VerifyEmail() {
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    const [token, setToken] = useState<string | null>();
    const [disabled, setDisabled] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const authToken = localStorage.getItem("token");
        const email = localStorage.getItem("email");
        if (authToken || !email)
            navigate("/");

        setToken(params.get("token"));
    }, []);

    useEffect(() => {
        if (token) verifyToken();
    }, [token]);

    const verifyToken = async () => {
        const email = localStorage.getItem("email");
        try {
            const res = await fetch(API_URL + "/verify-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token, email })
            });

            const data = await res.json();
            if (data.error) {
                navigate("/error?msg=" + encodeURIComponent(data.error));
            } else {
                toast.success("¡Tu cuenta fue verificada con éxito! Ya puedes comenzar a usar SwapVid");
                localStorage.setItem("token", data.token);
                navigate("/");
            }
        } catch (e) {
            navigate("/error");
        }
    }

    const handleSendLink = async () => {
        setDisabled(true);
        setSuccessMsg("");
        setErrorMsg("");

        const email = localStorage.getItem("email");
        try {
            const res = await fetch(API_URL + "/send-email-link", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            if (data.error) {
                setErrorMsg(data.error);
            } else {
                setSuccessMsg("Se ha enviado un correo con el enlace.");
            }
        } catch (e) {
            setErrorMsg("Ha ocurrido un error inesperado.");
        }
    }

    if (!token) return (
        <div className="flex min-h-svh w-full items-center justify-center p-3 md:p-10">
            <div className="flex gap-4 flex-col items-center justify-center">
                <h1 className="text-3xl font-bold">Verifica tu correo electrónico</h1>
                <p className="text-sm text-muted-foreground">Para continuar, primero tienes que verificar tu correo. Revisa tu bandeja de entrada o haz clic abajo para reenviar el enlace.</p>
                <Button variant="link" disabled={disabled} onClick={handleSendLink} className="cursor-pointer">Reenviar enlace</Button>
                {successMsg != "" && <p className="text-sm text-green-500">{successMsg}</p>}
                {errorMsg != "" && <p className="text-sm text-destructive">{errorMsg}</p>}
            </div>
        </div>
    );

    return (
        <div className="flex min-h-svh w-full items-center justify-center">
            <Spinner className="w-14 h-14" />
        </div>
    );
}
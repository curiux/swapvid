import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { API_URL } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { preloadedPlans } from "./plans";
import { toast } from "sonner";
import CancelSubscriptionDialog from "@/components/cancel-subscription-dialog";
import EditUserDataForm from "@/components/edit-userdata-form";
import { type UserData } from "@/lib/types";

/**
 * Profile page component
 * - Fetches and displays the current user's profile, subscription plan, and next billing date
 * - Handles authentication, session expiration, and error redirects
 * - Shows plan info, allows changing plan, cancelling subscription, and deleting account
 * - Navigates to home and clears storage if user is unauthorized or not found
 * - Displays toast messages from localStorage after certain actions
 * - Handles loading and error states
 * - Uses EditUserDataForm for editing user data and CancelSubscriptionDialog for managing subscription
 */
export default function Profile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<UserData>();
    const [plan, setPlan] = useState("");
    const [billingDate, setBillingDate] = useState<Date | undefined>();
    const [isCancelled, setIsCancelled] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        } else {
            getUserData(token);
        }

        const msg = localStorage.getItem("msg");
        if (msg) {
            setTimeout(() => {
                toast.success(msg);
                localStorage.removeItem("msg");
            }, 50);
        }
    }, []);

    const getUserData = async (token: String) => {
        try {
            const res = await fetch(API_URL + "/users/me", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.error) {
                if (res.status == 401 || res.status == 404) {
                    localStorage.clear();
                    toast("Tu sesión ha expirado.")
                    navigate("/");
                } else {
                    navigate("/error?msg=" + encodeURIComponent(data.error));
                }
            } else {
                setLoading(false);
                setUserData({
                    email: data.email,
                    username: data.username
                });
                setPlan(data.subscription.plan);
                setIsCancelled(data.isCancelled);
                data.nextPaymentDate && setBillingDate(new Date(data.nextPaymentDate));
            }
        } catch (e) {
            navigate("/error");
        }
    }

    if (loading) return (
        <div className="flex min-h-svh w-full items-center justify-center">
            <Spinner className="w-14 h-14" />
        </div>
    );

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-3 pt-16 md:p-10 md:pt-32">
            <div className="flex flex-col gap-5 w-full max-w-lg">
                <h1 className="text-3xl">Mi perfil</h1>
                <Separator />
                <EditUserDataForm userData={userData!} getUserData={getUserData} />
                <Separator />
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <p className="bg-muted p-1 rounded-sm">
                            Plan <span className="font-bold">{preloadedPlans.find(p => p.name == plan)?.nameShown}</span>
                        </p>
                        <Button asChild variant="outline" aria-label="Cambiar plan">
                            <Link to="/planes">Cambiar plan</Link>
                        </Button>
                    </div>
                    {plan != "basic" && (
                        <div className="flex items-center justify-between gap-5">
                            <CancelSubscriptionDialog isCancelled={isCancelled} />
                            <p className="text-xs italic">
                                {isCancelled
                                    ? "Seguirás disfrutando de todos los beneficios hasta el "
                                    : "Tu próxima fecha de facturación es el "
                                }
                                {billingDate!.toLocaleDateString("es-ES", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric"
                                })}</p>
                        </div>

                    )}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <p className="text-destructive">Eliminar cuenta</p>
                    <Button asChild variant="destructive" aria-label="Eliminar cuenta">
                        <Link to="/eliminar-cuenta">Eliminar</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { API_URL } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { preloadedPlans } from "./plans";

/**
 * Profile page component
 * - Fetches and displays the current user's subscription plan
 * - Handles authentication and error redirects
 * - Shows plan info and allows changing plan or deleting account
 */
export default function Profile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        } else {
            getUserData(token);
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
                    navigate("/");
                } else {
                    navigate("/error?msg=" + encodeURIComponent(data.error));
                }
            } else {
                setLoading(false);
                setSubscription("basic");
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
        <div className="flex min-h-svh w-full items-center justify-center p-3 md:p-10">
            <div className="flex flex-col gap-5 w-full max-w-lg">
                <h1 className="text-3xl">Mi perfil</h1>
                <Separator />
                <div className="flex items-center justify-between">
                    <p>Plan <span className="font-bold">{preloadedPlans.find(p => p.name == subscription)?.nameShown}</span></p>
                    <Button asChild variant="outline">
                        <Link to="/planes">Cambiar plan</Link>
                    </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <p className="text-destructive">Eliminar cuenta</p>
                    <Button asChild variant="destructive">
                        <Link to="/eliminar-cuenta">Eliminar</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
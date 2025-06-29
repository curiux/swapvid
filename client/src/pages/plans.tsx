import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Plan } from "@/lib/types";
import { API_URL, formatBytes } from "@/lib/utils";
import { CircleCheck, Infinity } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

interface PricingPlan {
    name: string;
    nameShown: string;
    description: string;
    features: string[];
}

export const preloadedPlans: PricingPlan[] = [
    {
        name: "basic",
        nameShown: "Básico",
        description: "Funciones esenciales para empezar.",
        features: []
    },
    {
        name: "advanced",
        nameShown: "Avanzado",
        description: "Más espacio y mejores beneficios.",
        features: [
            "Estadísticas sobre intercambios y videos",
            "Prioridad en intercambios",
        ]
    },
    {
        name: "premium",
        nameShown: "Premium",
        description: "Más espacio, intercambios ilimitados y prioridad.",
        features: [
            "Prioridad en resultados de búsqueda",
            "Soporte preferencial"
        ]
    }
];

/**
 * Plans page component
 * - Fetches available subscription plans from the API and displays them
 * - Uses preloadedPlans for static plan info (name, description, features)
 * - Renders plan details, pricing, and action buttons
 * - Uses PlanDetails for displaying plan limits and features
 * - Handles loading and error states
 */
export default function Plans() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<Plan[]>();

    useEffect(() => {
        getPlans();
    }, []);

    const getPlans = async () => {
        try {
            const res = await fetch(API_URL + "/plans");

            const data = await res.json();
            if (data.error) {
                navigate("/error?msg=" + encodeURIComponent(data.error));
            } else {
                setLoading(false);
                setPlans(data.plans);
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
        <section className="py-18 px-4">
            <div className="flex flex-col items-center gap-6 text-center">
                <h2 className="text-4xl font-semibold text-pretty lg:text-6xl">Planes</h2>
                <div className="flex flex-col gap-1">
                    <p className="text-muted-foreground lg:text-lg">Descubrí las ventajas de cada plan y potencia tu experiencia.</p>
                    <p className="text-muted-foreground text-xs">(Precios en dólares estadounidenses)</p>
                </div>
                <div className="flex flex-col flex-wrap items-stretch justify-center gap-6 md:flex-row">
                    {plans!.map((plan) => (
                        <Card
                            key={plan._id}
                            className="flex flex-col justify-between text-left"
                        >
                            <CardHeader>
                                <CardTitle>
                                    <p>{preloadedPlans.find(p => p.name == plan.name)!.nameShown}</p>
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {preloadedPlans.find(p => p.name == plan.name)!.description}
                                </p>
                                <div className="flex items-end">
                                    {plan.name == "basic" ? (
                                        <span className="text-3xl font-semibold">
                                            Gratis
                                        </span>
                                    ) : (
                                        <>
                                            <span className="text-4xl font-semibold">
                                                {plan.monthlyPrice}
                                            </span>
                                            <span className="text-2xl font-semibold text-muted-foreground">
                                                /mes
                                            </span>
                                        </>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Separator className="mb-6" />
                                <ul className="space-y-4">
                                    <PlanDetails text="Almacenamiento en biblioteca" value={formatBytes(plan.libraryStorage)} />
                                    <PlanDetails text="Cantidad de videos máxima" value={plan.librarySize + ""} />
                                    <PlanDetails text="Tamaño máximo de cada video" value={formatBytes(plan.videoMaxSize)} />
                                    <PlanDetails text="Límite de intercambios" value={plan.exchangeLimit + ""} />
                                    {plan.name == "premium" && (
                                        <p className="text-sm font-semibold">Todo lo que incluye el plan Avanzado más:</p>
                                    )}
                                    {preloadedPlans.find(p => p.name == plan.name)!.features.map((feature, index) => (
                                        <li
                                            key={index}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <CircleCheck className="size-4" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter className="mt-auto">
                                {plan.name != "basic" && (
                                    <Button asChild className="w-full">
                                        <a href="#" target="_blank">
                                            Elegir este plan
                                        </a>
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}

/**
 * PlanDetails component
 * - Shows a single plan detail row with label and value
 * - Displays infinity icon if value is "0"
 */
function PlanDetails({ text, value }: { text: string, value: string }) {
    return (
        <li className="grid grid-cols-3 items-center gap-2 text-sm">
            <span className="col-span-2 font-semibold">{text}:</span>
            <span className="col-span-1 bg-muted p-1 rounded-sm text-center font-medium">
                {value == "0" ? (
                    <Infinity className="mx-auto" />
                ) : value}
            </span>
        </li>
    );
}
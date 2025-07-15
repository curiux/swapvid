import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const API_URL = import.meta.env.VITE_API_URL;

export const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY;

export const videoCategories = [
    { id: "entertainment", label: "Entretenimiento" },
    { id: "education", label: "Educación" },
    { id: "sports", label: "Deportes" },
    { id: "music", label: "Música" },
    { id: "science_technology", label: "Ciencia y Tecnología" },
    { id: "comedy", label: "Comedia" },
    { id: "fashion_beauty", label: "Moda y Belleza" },
    { id: "travel_adventure", label: "Viajes y Aventura" },
    { id: "gaming", label: "Gaming" },
    { id: "news_politics", label: "Noticias y Política" },
    { id: "cooking_gastronomy", label: "Cocina y Gastronomía" },
    { id: "art_design", label: "Arte y Diseño" },
    { id: "animation_shortfilms", label: "Animación y Cortometrajes" },
    { id: "health_fitness", label: "Salud y Fitness" },
    { id: "vlogs_lifestyle", label: "Vlogs y Estilo de Vida" },
    { id: "tutorials", label: "Tutoriales" },
    { id: "movies_series", label: "Cine y Series" },
    { id: "events_conferences", label: "Eventos y Conferencias" },
    { id: "pets_animals", label: "Mascotas y Animales" },
    { id: "automobiles_mechanics", label: "Automóviles y Mecánica" },
    { id: "other", label: "Otros" }
];

export const exchangeStatusList = [
    { id: "pending", label: "Pendiente", color: "bg-yellow-500" },
    { id: "accepted", label: "Aceptado", color: "bg-green-500" },
    { id: "rejected", label: "Rechazado", color: "bg-red-500" }
];

export const reportReasons = [
    { id: "inappropriate_unmarked", label: "Contenido inapropiado sin marcar como tal" },
    { id: "irrelevant_or_empty", label: "El video no contiene contenido relevante o está vacío" },
    { id: "unauthorized_content", label: "Contenido con derechos de autor o sin permiso para compartirse" },
    { id: "duplicate_video", label: "Video duplicado" },
    { id: "other", label: "Otro (especificar)" }
];

export const MAX_FILE_SIZE_BY_PLAN = {
    basic: 500 * 1024 * 1024,
    advanced: 2 * 1024 * 1024 * 1024,
    premium: 10 * 1024 * 1024 * 1024
};

/**
 * Returns a human-readable relative time string (e.g., "hace 2 días") for a given date.
 * Uses Intl.RelativeTimeFormat for Spanish localization.
 */
export function timeAgo(dateISO: any) {
    const date: any = new Date(dateISO);
    const now: any = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

    const intervals: { unit: Intl.RelativeTimeFormatUnit, seconds: number }[] = [
        { unit: "year", seconds: 31536000 },
        { unit: "month", seconds: 2592000 },
        { unit: "week", seconds: 604800 },
        { unit: "day", seconds: 86400 },
        { unit: "hour", seconds: 3600 },
        { unit: "minute", seconds: 60 },
        { unit: "second", seconds: 1 },
    ];

    for (const { unit, seconds: intervalSeconds } of intervals) {
        const delta = Math.floor(seconds / intervalSeconds);
        if (delta >= 1) {
            return rtf.format(-delta, unit);
        }
    }

    return "justo ahora";
}

/**
 * Converts a number of bytes into a human-readable string with appropriate units (e.g., KB, MB).
 * Rounds the value to the nearest integer and selects the largest possible unit.
 */
export function formatBytes(bytes: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    let value = bytes;

    while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i++;
    }

    return `${Math.round(value)} ${units[i]}`;
}
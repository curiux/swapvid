import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const API_URL = import.meta.env.VITE_API_URL;

export const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY;

export const videoCategories = [
  { id: "entretenimiento", label: "Entretenimiento" },
  { id: "educacion", label: "Educación" },
  { id: "deportes", label: "Deportes" },
  { id: "musica", label: "Música" },
  { id: "ciencia_tecnologia", label: "Ciencia y Tecnología" },
  { id: "comedia", label: "Comedia" },
  { id: "moda_belleza", label: "Moda y Belleza" },
  { id: "viajes_aventura", label: "Viajes y Aventura" },
  { id: "gaming", label: "Gaming" },
  { id: "noticias_politica", label: "Noticias y Política" },
  { id: "cocina_gastronomia", label: "Cocina y Gastronomía" },
  { id: "arte_diseno", label: "Arte y Diseño" },
  { id: "animacion_cortometrajes", label: "Animación y Cortometrajes" },
  { id: "salud_fitness", label: "Salud y Fitness" },
  { id: "vlogs_estilo_vida", label: "Vlogs y Estilo de Vida" },
  { id: "tutoriales", label: "Tutoriales" },
  { id: "cine_series", label: "Cine y Series" },
  { id: "eventos_conferencias", label: "Eventos y Conferencias" },
  { id: "mascotas_animales", label: "Mascotas y Animales" },
  { id: "automoviles_mecanica", label: "Automóviles y Mecánica" },
  { id: "otros", label: "Otros" }
];

export const exchangeStatusList = [
  { id: "pending", label: "Pendiente", color: "bg-yellow-500" },
  { id: "accepted", label: "Aceptado", color: "bg-green-500" },
  { id: "rejected", label: "Rechazado", color: "bg-red-500" }
];

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
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const API_URL = import.meta.env.VITE_API_URL;

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
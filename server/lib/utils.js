export const videoCategoryIds = [
  "entretenimiento",
  "educacion",
  "deportes",
  "musica",
  "ciencia_tecnologia",
  "comedia",
  "moda_belleza",
  "viajes_aventura",
  "gaming",
  "noticias_politica",
  "cocina_gastronomia",
  "arte_diseno",
  "animacion_cortometrajes",
  "salud_fitness",
  "vlogs_estilo_vida",
  "tutoriales",
  "cine_series",
  "eventos_conferencias",
  "mascotas_animales",
  "automoviles_mecanica",
  "otros"
];

import multer from "multer";

const storage = multer.memoryStorage();
export const upload = multer({ storage });
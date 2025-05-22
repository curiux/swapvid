import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Link } from "react-router";

/**
 * This component renders the terms and conditions page for SwapVid.
 * It displays the terms and conditions content inside a scrollable card layout.
 * The document outlines the rules, user responsibilities, intellectual property, and other legal aspects of using the service.
 * Users must agree to these terms to use the SwapVid platform.
 */
export default function TermsAndConditions() {
    return (
        <ScrollArea className="h-screen p-6 pt-20">
            <Card className="max-w-4xl mx-auto">
                <CardContent className="space-y-6 p-6">
                    {/* --- Introduction --- */}
                    <h1 className="text-3xl font-bold mb-4">TÉRMINOS Y CONDICIONES</h1>
                    <p className="text-sm text-gray-500 mb-6">Última actualización: 22 de mayo de 2025</p>
                    <p className="mb-4">
                        Estos Términos y Condiciones constituyen un acuerdo legal vinculante entre usted y SwapVid, en relación con su acceso y uso del sitio web <Link to="/" className="underline underline-offset-4">https://swapvid.vercel.app</Link> y otros servicios relacionados (colectivamente, los "Servicios").
                    </p>
                    <p className="mb-4">
                        Al acceder a los Servicios, usted acepta estar sujeto a estos términos. Si no está de acuerdo, no debe usar los Servicios.
                    </p>
                    <p className="mb-4">
                        Los Servicios están dirigidos a personas mayores de 18 años. Si es menor de edad, no puede utilizarlos ni registrarse.
                    </p>
                    <Separator />

                    {/* --- Section 1: Nuestros Servicios --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">1. NUESTROS SERVICIOS</h2>
                    <p className="mb-4">
                        La información disponible a través de los Servicios no está destinada a ser distribuida o utilizada por personas en jurisdicciones donde dicha distribución o uso sea contrario a la ley. Usted es responsable de cumplir con la legislación local si accede desde fuera de Argentina.
                    </p>
                    <Separator />

                    {/* --- Section 2: Derechos de Propiedad Intelectual --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">2. DERECHOS DE PROPIEDAD INTELECTUAL</h2>
                    <p className="mb-4">
                        Todos los derechos sobre los Servicios, incluyendo código fuente, diseño, imágenes, audio, video, marcas y contenido están protegidos por leyes de propiedad intelectual y pertenecen a SwapVid o a sus licenciantes.
                    </p>
                    <p className="mb-4">
                        Se le concede una licencia limitada, no exclusiva y revocable para acceder y usar los Servicios únicamente para uso personal o interno.
                    </p>
                    <p className="mb-4">
                        No se permite copiar, reproducir, distribuir, mostrar públicamente ni explotar comercialmente ningún contenido sin permiso escrito.
                    </p>
                    <Separator />

                    {/* --- Section 3: Declaraciones del Usuario --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">3. DECLARACIONES DEL USUARIO</h2>
                    <p className="mb-4">
                        Al usar los Servicios, usted declara que:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                        <li>Toda la información que proporciona es verdadera y actualizada.</li>
                        <li>Posee capacidad legal para aceptar estos Términos.</li>
                        <li>No es menor de edad en su jurisdicción.</li>
                        <li>No usará medios automatizados para acceder.</li>
                        <li>No usará los Servicios para fines ilegales.</li>
                    </ul>
                    <Separator />
                    {/* --- Section 4: Registro de Usuario --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">4. REGISTRO DE USUARIO</h2>
                    <p className="mb-4">
                        Para usar ciertas funciones, puede que deba registrarse. Usted se compromete a mantener la confidencialidad de su contraseña
                        y será responsable de todas las actividades que ocurran con su cuenta.
                    </p>
                    <Separator />

                    {/* --- Section 5: Actividades Prohibidas --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">5. ACTIVIDADES PROHIBIDAS</h2>
                    <p className="mb-4">
                        Usted no puede usar los Servicios para ningún propósito distinto al previsto. Las actividades prohibidas incluyen, entre otras:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                        <li>Extraer datos del sistema sin autorización.</li>
                        <li>Eludir medidas de seguridad.</li>
                        <li>Usar el contenido para fines comerciales no autorizados.</li>
                        <li>Transmitir contenido ilegal, ofensivo o engañoso.</li>
                        <li>Interferir con el funcionamiento de los Servicios.</li>
                    </ul>
                    <Separator />

                    {/* --- Section 6: Contribuciones del Usuario --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">6. CONTRIBUCIONES DEL USUARIO</h2>
                    <p className="mb-4">
                        Puede tener la posibilidad de enviar contenido (como texto, imágenes, videos o comentarios). Usted declara tener los derechos necesarios para publicar dicho contenido y nos otorga una licencia irrevocable para su uso.
                    </p>
                    <p className="mb-4">
                        Nos reservamos el derecho de eliminar cualquier contribución que consideremos inapropiada o que viole estos Términos.
                    </p>
                    <p className="mb-4">
                        Usted es responsable del contenido que publica y nos indemnizará ante cualquier reclamo que surja por ello.
                    </p>
                    <Separator />
                </CardContent>
            </Card>
        </ScrollArea>
    );
}
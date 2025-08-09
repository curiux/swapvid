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
                        Estos Términos y Condiciones constituyen un acuerdo legal vinculante entre usted y SwapVid, en relación con su acceso y uso del sitio web <Link to="/" className="underline underline-offset-4">https://swapvid.online</Link> y otros servicios relacionados (colectivamente, los "Servicios").
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
                        La información disponible a través de los Servicios no está destinada a ser distribuida o utilizada por personas en jurisdicciones donde dicha distribución o uso sea contrario a la ley. Usted es responsable de cumplir con la legislación local si accede desde fuera de Uruguay.
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

                    {/* --- Section 7: Licencia sobre Contribuciones --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">7. LICENCIA SOBRE CONTRIBUCIONES</h2>
                    <p className="mb-4">
                        Al publicar contenido en los Servicios, usted nos otorga una licencia perpetua, irrevocable, mundial, libre de regalías y transferible para usar, reproducir, modificar, distribuir y mostrar dicho contenido en cualquier medio y con cualquier fin.
                    </p>
                    <p className="mb-4">
                        Esto incluye su nombre, imagen y cualquier dato asociado a las contribuciones si decide compartirlos públicamente.
                    </p>
                    <Separator />

                    {/* --- Section 8: Directrices para Reseñas --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">8. DIRECTRICES PARA RESEÑAS</h2>
                    <p className="mb-4">
                        Puede publicar reseñas o valoraciones de los Servicios, siempre que sean basadas en su experiencia personal, no sean ofensivas ni contengan lenguaje discriminatorio, ilegal o falso.
                    </p>
                    <p className="mb-4">
                        Nos reservamos el derecho de moderar, editar o eliminar reseñas que incumplan estas directrices.
                    </p>
                    <Separator />

                    {/* --- Section 9: Gestión de los Servicios --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">9. GESTIÓN DE LOS SERVICIOS</h2>
                    <p className="mb-4">
                        Nos reservamos el derecho de supervisar los Servicios para detectar violaciones a estos Términos, tomar acciones legales,
                        restringir su acceso o modificar cualquier contenido, si es necesario para proteger nuestros derechos o los de otros usuarios.
                    </p>
                    <Separator />

                    {/* --- Section 10: Política de Privacidad --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">10. POLÍTICA DE PRIVACIDAD</h2>
                    <p className="mb-4">
                        Al usar los Servicios, usted acepta que el tratamiento de sus datos se realizará conforme a nuestra <Link to="/politica-de-privacidad" className="underline underline-offset-4">Política de Privacidad</Link>.
                    </p>
                    <p className="mb-4">
                        Esta política explica qué datos recopilamos, cómo los usamos y qué derechos tiene usted sobre su información personal.
                    </p>
                    <Separator />

                    {/* --- Section 11: Infracciones de Copyright --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">11. INFRACCIONES DE COPYRIGHT</h2>
                    <p className="mb-4">
                        Respetamos los derechos de propiedad intelectual. Si cree que algún contenido de los Servicios infringe sus derechos de autor, puede notificarnos proporcionando información legalmente válida sobre la infracción.
                    </p>
                    <Separator />

                    {/* --- Section 12: Duración y Terminación --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">12. DURACIÓN Y TERMINACIÓN</h2>
                    <p className="mb-4">
                        Estos Términos estarán vigentes mientras utilice los Servicios. Nos reservamos el derecho de suspender o cancelar su cuenta y acceso si viola estos Términos, sin previo aviso.
                    </p>
                    <p className="mb-4">
                        También puede cancelar su cuenta en cualquier momento, dejando de usar los Servicios.
                    </p>
                    <Separator />

                    {/* --- Section 13: Modificaciones e Interrupciones --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">13. MODIFICACIONES E INTERRUPCIONES</h2>
                    <p className="mb-4">
                        Nos reservamos el derecho de cambiar, modificar o eliminar el contenido de los Servicios en cualquier momento, sin previo aviso. No seremos responsables si alguna parte de los Servicios no está disponible temporalmente.
                    </p>
                    <p className="mb-4">
                        También podemos limitar ciertas funciones o su acceso a los Servicios por mantenimiento, actualizaciones u otros motivos.
                    </p>
                    <Separator />

                    {/* --- Section 14: Ley Aplicable --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">14. LEY APLICABLE</h2>
                    <p className="mb-4">
                        Estos Términos se rigen e interpretan de acuerdo con las leyes de la Republica Oriental del Uruguay. El uso de los Servicios no está autorizado en jurisdicciones que no den efecto a todas las disposiciones de estos Términos.
                    </p>
                    <Separator />

                    {/* --- Section 15: Resolución de Disputas --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">15. RESOLUCIÓN DE DISPUTAS</h2>
                    <p className="mb-4">
                        En caso de controversias relacionadas con estos Términos o los Servicios, primero intentaremos resolver el conflicto de forma amistosa.
                        Si no se logra, usted acepta que el conflicto será resuelto por los tribunales ordinarios de la ciudad de Montevideo, República Oriental del Uruguay.
                    </p>
                    <Separator />

                    {/* --- Section 16: Correcciones --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">16. CORRECCIONES</h2>
                    <p className="mb-4">
                        Puede haber errores tipográficos, inexactitudes u omisiones en los Servicios. Nos reservamos el derecho de corregir cualquier error
                        y actualizar la información en cualquier momento, sin previo aviso.
                    </p>
                    <Separator />

                    {/* --- Section 17: Renuncia de Responsabilidad --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">17. RENUNCIA DE RESPONSABILIDAD</h2>
                    <p className="mb-4">
                        Los Servicios se proporcionan "tal cual" y "según disponibilidad". Usted acepta que el uso de los Servicios será bajo su propio riesgo.
                        No garantizamos que los Servicios sean ininterrumpidos, seguros o libres de errores.
                    </p>
                    <Separator />

                    {/* --- Section 18: Limitación de Responsabilidad --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">18. LIMITACIÓN DE RESPONSABILIDAD</h2>
                    <p className="mb-4">
                        En ningún caso seremos responsables por daños indirectos, incidentales, consecuentes, ejemplares o punitivos, incluyendo pérdida de beneficios o datos, derivados del uso o la imposibilidad de usar los Servicios.
                    </p>
                    <p className="mb-4">
                        Nuestra responsabilidad total ante usted, por cualquier causa, estará limitada al menor entre el monto que usted nos haya pagado, si corresponde, o $10.000 pesos uruguayos.
                    </p>
                    <Separator />

                    {/* --- Section 19: Indemnización --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">19. INDEMNIZACIÓN</h2>
                    <p className="mb-4">
                        Usted acepta defender, indemnizar y eximir de responsabilidad a SwapVid, sus afiliados y empleados por cualquier pérdida, daño, responsabilidad, reclamo o demanda, incluyendo honorarios razonables de abogados, debido a:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                        <li>su uso de los Servicios,</li>
                        <li>el incumplimiento de estos Términos,</li>
                        <li>su violación de los derechos de terceros.</li>
                    </ul>
                    <Separator />

                    {/* --- Section 20: Datos del Usuario --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">20. DATOS DEL USUARIO</h2>
                    <p className="mb-4">
                        Mantenemos ciertos datos que usted transmite a los Servicios con el fin de gestionar su funcionamiento. Aunque realizamos copias de seguridad rutinarias, usted es responsable de los datos que transmite o que se relacionan con cualquier actividad realizada usando su cuenta.
                    </p>
                    <p className="mb-4">
                        Usted acepta que no seremos responsables ante ninguna pérdida o corrupción de dichos datos, y renuncia a cualquier derecho de acción contra nosotros derivado de dicha pérdida o corrupción.
                    </p>
                    <Separator />

                    {/* --- Section 21: Comunicaciones Electrónicas, Transacciones y Firmas --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">21. COMUNICACIONES ELECTRÓNICAS, TRANSACCIONES Y FIRMAS</h2>
                    <p className="mb-4">
                        Usted consiente recibir comunicaciones electrónicas, y acepta que todos los acuerdos, notificaciones, divulgaciones y otras comunicaciones que le proporcionemos electrónicamente cumplen con cualquier requisito legal de que dichas comunicaciones se hagan por escrito.
                    </p>
                    <p className="mb-4">
                        Asimismo, acepta el uso de firmas electrónicas, contratos, órdenes y otros registros, y la entrega electrónica de avisos, políticas y registros de transacciones iniciadas o completadas por nosotros o a través de los Servicios.
                    </p>
                    <Separator />

                    {/* --- Section 22: Misceláneos --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">22. MISCELÁNEOS</h2>
                    <p className="mb-4">
                        Estos Términos y Condiciones constituyen el acuerdo completo entre usted y nosotros con respecto al uso de los Servicios.
                        La falta de ejercicio o exigencia de cumplimiento de alguna disposición no constituirá una renuncia a tal derecho.
                    </p>
                    <p className="mb-4">
                        Si alguna disposición de estos Términos se considera inválida, ilegal o inaplicable, las demás disposiciones permanecerán en pleno vigor.
                    </p>
                    <p className="mb-4">
                        Usted no puede transferir ninguno de sus derechos u obligaciones bajo estos Términos sin nuestro consentimiento previo por escrito.
                    </p>
                    <Separator />

                    {/* --- Section 23: Contáctenos --- */}
                    <h2 className="text-2xl font-semibold mt-8 mb-4">23. CONTÁCTENOS</h2>
                    <p className="mb-4">
                        Para resolver una queja sobre los Servicios o recibir más información, puede contactarnos al correo electrónico:{" "}
                        <span className="font-medium">soporte@swapvid.online</span>.
                    </p>
                    <Separator />

                </CardContent>
            </Card>
        </ScrollArea>
    );
}
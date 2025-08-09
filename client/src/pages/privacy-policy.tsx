import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Link } from "react-router";


/**
 * This component renders the privacy policy page for SwapVid.
 * It displays the privacy policy content inside a scrollable card layout.
 * The policy includes sections about data collection, processing, user rights, and more.
 * Users can review, update, or request deletion of their data as described in the document.
 */
export default function PrivacyPolicy() {
    return (
        <ScrollArea className="h-screen p-6 pt-20">
            <Card className="max-w-4xl mx-auto">
                <CardContent className="space-y-6 p-6">
                    {/* Introduction */}
                    <h1 className="text-3xl font-bold">Política de Privacidad</h1>
                    <p className="text-sm text-gray-500">Última actualización: 22 de mayo de 2025</p>
                    <p>
                        Este Aviso de Privacidad para SwapVid ("nosotros", "nos", o "nuestro") describe cómo y por qué podemos acceder, recopilar,
                        almacenar, usar y/o compartir ("procesar") tu información personal cuando utilizas nuestros servicios ("Servicios"), incluyendo cuando:
                    </p>
                    <ul className="list-disc ml-6">
                        <li>Visitas nuestro sitio web en <Link to="/" className="underline underline-offset-4">https://swapvid.online</Link></li>
                        <li>Interactúas con nosotros en ventas, marketing o eventos relacionados</li>
                    </ul>
                    <p>
                        Si tienes preguntas o inquietudes, leer este aviso te ayudará a entender tus derechos y opciones. Si no estás de acuerdo con nuestras políticas,
                        por favor no uses nuestros Servicios.
                    </p>
                    <Separator />

                    {/* Key points */}
                    <h2 className="text-2xl font-semibold">Resumen de Puntos Clave</h2>
                    <p>Este resumen proporciona puntos clave sobre nuestro Aviso de Privacidad:</p>
                    <ul className="list-disc ml-6">
                        <li><strong>¿Qué información personal procesamos?</strong> Puede variar según tu interacción con nosotros. Aprende más en la sección correspondiente.</li>
                        <li><strong>¿Procesamos información sensible?</strong> No procesamos información personal sensible.</li>
                        <li><strong>¿Recopilamos información de terceros?</strong> No recopilamos información de terceros.</li>
                        <li><strong>¿Cómo procesamos tu información?</strong> Para ofrecer, mejorar y administrar nuestros Servicios, entre otros fines legales.</li>
                        <li><strong>¿Con quién compartimos tu información?</strong> Solo en situaciones específicas con terceros específicos.</li>
                        <li><strong>¿Cómo protegemos tu información?</strong> Con medidas técnicas y organizativas razonables, aunque no podemos garantizar seguridad total.</li>
                        <li><strong>¿Cuáles son tus derechos?</strong> Puedes tener derechos según tu ubicación geográfica. Aprende más en la sección de derechos.</li>
                        <li><strong>¿Cómo ejercer tus derechos?</strong> Contáctanos o visita nuestro sitio web.</li>
                    </ul>
                    <Separator />

                    {/* Section 1: Qué información recopilamos */}
                    <h2 className="text-2xl font-semibold">1. ¿Qué información recopilamos?</h2>
                    <p><strong>Información personal que nos proporcionas:</strong></p>
                    <p>Recopilamos información personal que tú voluntariamente nos proporcionas al registrarte, mostrar interés en nuestros productos o servicios,
                        participar en actividades o comunicarte con nosotros.</p>
                    <ul className="list-disc ml-6">
                        <li>Nombres</li>
                        <li>Correos electrónicos</li>
                        <li>Nombre de usuario</li>
                        <li>Contraseñas</li>
                    </ul>
                    <p><strong>Información de pago:</strong> Puede incluir el número del instrumento de pago y su código de seguridad. SwapVid utiliza MercadoPago. Puedes consultar su política de privacidad <a className="underline underline-offset-4" href="https://www.mercadopago.com.uy/privacidad/declaracion-privacidad" target="_blank" rel="noopener noreferrer">aquí</a>.</p>
                    <Separator />

                    {/* Section 2: Cómo procesamos tu información */}
                    <h2 className="text-2xl font-semibold">2. ¿Cómo procesamos tu información?</h2>
                    <p>
                        Procesamos tu información para:
                    </p>
                    <ul className="list-disc ml-6">
                        <li>Facilitar la creación de cuentas y autenticación</li>
                        <li>Gestionar pedidos, pagos, devoluciones y cambios</li>
                        <li>Habilitar comunicaciones entre usuarios</li>
                        <li>Proteger nuestros servicios contra fraudes</li>
                        <li>Cumplir con leyes y regulaciones</li>
                        <li>Responder a solicitudes legales y prevenir daños</li>
                    </ul>
                    <Separator />

                    {/* Section 3: Con quién compartimos tu información */}
                    <h2 className="text-2xl font-semibold">3. ¿Con quién compartimos tu información personal?</h2>
                    <p>
                        Compartimos información únicamente cuando es necesario con:
                    </p>
                    <ul className="list-disc ml-6">
                        <li>Proveedores de servicios</li>
                        <li>Autoridades legales cuando lo requiera la ley</li>
                        <li>Otros usuarios cuando tú decidas compartirla</li>
                    </ul>
                    <Separator />

                    {/* Section 4: Cómo protegemos tu información */}
                    <h2 className="text-2xl font-semibold">4. ¿Cómo protegemos tu información?</h2>
                    <p>
                        Implementamos medidas técnicas y organizativas apropiadas para proteger tu información personal. A pesar de esto,
                        ninguna transmisión por internet es 100% segura, por lo que no podemos garantizar seguridad absoluta.
                    </p>
                    <Separator />

                    {/* Section 5: Derechos de privacidad */}
                    <h2 className="text-2xl font-semibold">5. ¿Cuáles son tus derechos?</h2>
                    <p>
                        Dependiendo de tu ubicación, puedes tener derechos legales respecto a tu información personal, como acceder,
                        corregir, o eliminar tus datos. Para ejercer estos derechos, contáctanos directamente.
                    </p>
                    <Separator />

                    {/* Section 6: Menores de edad */}
                    <h2 className="text-2xl font-semibold">6. ¿Recopilamos información de menores?</h2>
                    <p>
                        No recopilamos conscientemente datos de menores de 18 años. Si te das cuenta de que un menor nos ha proporcionado datos,
                        por favor contáctanos para eliminarlos.
                    </p>
                    <Separator />

                    {/* Section 7: Actualizaciones a esta política */}
                    <h2 className="text-2xl font-semibold">7. ¿Actualizamos este aviso?</h2>
                    <p>
                        Sí, actualizaremos este aviso según sea necesario para mantenernos en cumplimiento con las leyes aplicables. La fecha de la última actualización
                        siempre estará indicada en la parte superior de este documento.
                    </p>
                    <Separator />

                    {/* Section 8: Revisión y eliminación de datos */}
                    <h2 className="text-2xl font-semibold">8. ¿Cómo puedes revisar, actualizar o eliminar los datos que recopilamos?</h2>
                    <p>
                        Puedes solicitar revisar, actualizar o eliminar tu información personal contactándonos directamente a través del sitio web de SwapVid.
                        Responderemos conforme a las leyes de protección de datos aplicables.
                    </p>
                    <Separator />
                </CardContent>
            </Card>
        </ScrollArea>
    );
}
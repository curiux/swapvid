import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router";
import "./index.css";
import Home from "./pages/home.tsx";
import Error from "./pages/error.tsx";
import Register from "./pages/register.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import Login from "./pages/login.tsx";
import DeleteAccount from "./pages/delete-account.tsx";
import AppLayout from "./components/app-layout";
import TermsAndConditions from "./pages/terms-and-conditions.tsx";
import PrivacyPolicy from "./pages/privacy-policy.tsx";
import MyCollection from "./pages/my-collection.tsx";
import MyVideos from "./pages/collection/my-videos.tsx";
import NotFound from "./pages/not-found.tsx";
import VideoUpload from "./pages/collection/video-upload.tsx";
import Video from "./pages/video.tsx";
import EditVideo from "./pages/edit-video.tsx";
import Profile from "./pages/profile.tsx";
import MyExchanges from "./pages/collection/my-exchanges.tsx";
import Exchange from "./pages/collection/exchange.tsx";
import Rating from "./pages/collection/rating.tsx";
import Plans from "./pages/plans.tsx";
import Search from "./pages/search.tsx";
import PasswordRecover from "./pages/password-recover.tsx";
import PasswordReset from "./pages/password-reset.tsx";
import VerifyEmail from "./pages/verify-email.tsx";
import Statistics from "./pages/collection/statistics.tsx";
import Page from "./components/page.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { path: "", element: <Page title="Inicio " element={<Home />} /> },
      { path: "error", element: <Page title="Error" element={<Error />} /> },
      { path: "registro", element: <Page title="Registro" element={<Register />} /> },
      { path: "login", element: <Page title="Inicio de Sesión" element={<Login />} /> },
      { path: "terminos-y-condiciones", element: <Page title="Términos y Condiciones" element={<TermsAndConditions />} /> },
      { path: "politica-de-privacidad", element: <Page title="Política de Privacidad" element={<PrivacyPolicy />} /> },
      { path: "eliminar-cuenta", element: <Page title="Eliminar Cuenta" element={<DeleteAccount />} /> },
      { path: "perfil", element: <Profile /> },
      {
        path: "mi-coleccion", element: <MyCollection />, children: [
          { path: "", element: <Page title="Mis videos" element={<MyVideos />} /> },
          { path: "subir", element: <Page title="Subir video" element={<VideoUpload />} /> },
          {
            path: "intercambios", element: <Page title="Mis intercambios" element={<MyExchanges />} />, children: [
              { path: "calificar/:id", element: <Rating /> }
            ]
          },
          { path: "intercambios/:id", element: <Exchange /> },
          { path: "estadisticas", element: <Page title="Estadísticas" element={<Statistics />} /> }
        ]
      },
      {
        path: "video/:id", element: <Video />, children: [
          { path: "editar", element: <EditVideo /> }
        ]
      },
      { path: "planes", element: <Page title="Planes" element={<Plans />} /> },
      { path: "buscar", element: <Search />},
      { path: "recuperar-contrasena", element: <Page title="Recuperar contraseña" element={<PasswordRecover />} /> },
      { path: "cambiar-contrasena", element: <Page title="Cambiar contraseña" element={<PasswordReset />} /> },
      { path: "verificar-email", element: <Page title="Verifica tu correo electrónico" element={<VerifyEmail />} /> },
      { path: "*", element: <Page title="Página no encontrada" element={<NotFound />} /> }
    ]
  }
]);

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="theme">
    <RouterProvider router={router} />
  </ThemeProvider>
)

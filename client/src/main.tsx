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

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { path: "", element: <Home /> },
      { path: "error", element: <Error /> },
      { path: "registro", element: <Register /> },
      { path: "login", element: <Login /> },
      { path: "terminos-y-condiciones", element: <TermsAndConditions /> },
      { path: "politica-de-privacidad", element: <PrivacyPolicy /> },
      { path: "eliminar-cuenta", element: <DeleteAccount /> },
      { path: "perfil", element: <Profile /> },
      {
        path: "mi-coleccion", element: <MyCollection />, children: [
          { path: "", element: <MyVideos /> },
          { path: "subir", element: <VideoUpload /> },
          { path: "intercambios", element: <MyExchanges /> },
          { path: "intercambios/:id", element: <Exchange /> }
        ]
      },
      {
        path: "video/:id", element: <Video />, children: [
          { path: "editar", element: <EditVideo /> }
        ]
      },
      { path: "*", element: <NotFound /> }
    ]
  }
]);

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="theme">
    <RouterProvider router={router} />
  </ThemeProvider>
)

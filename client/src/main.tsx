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
import Account from "./pages/account.tsx";
import AccountVideos from "./pages/account/videos.tsx";
import AccountSettings from "./pages/account/account-settings.tsx";
import NotFound from "./pages/not-found.tsx";

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
      { path: "cuenta", element: <Account />, children: [
        { path: "", element: <AccountVideos /> },
        { path: "ajustes", element: <AccountSettings /> }
      ]},
      { path: "*", element: <NotFound /> }
    ]
  }
]);

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="theme">
    <RouterProvider router={router} />
  </ThemeProvider>
)

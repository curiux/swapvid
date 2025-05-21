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

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { path: "", element: <Home /> },
      { path: "error", element: <Error /> },
      { path: "registro", element: <Register /> },
      { path: "login", element: <Login /> },
      { path: "eliminar-cuenta", element: <DeleteAccount /> }
    ]
  }
]);

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="theme">
    <RouterProvider router={router} />
  </ThemeProvider>
)

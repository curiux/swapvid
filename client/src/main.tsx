import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router";
import "./index.css"
import Home from "./pages/home.tsx"
import Register from "./pages/register.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import Login from "./pages/login.tsx";
import Navbar from "./components/navbar.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/registro",
    element: <Register />
  },
  {
    path: "/login",
    element: <Login />
  }
]);

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="theme">
    <Navbar />
    <RouterProvider router={router} />
  </ThemeProvider>
)

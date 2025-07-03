import { Outlet } from "react-router";
import Navbar from "./navbar";
import { Toaster } from "./ui/sonner";

export default function AppLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Toaster position="top-center" />
    </>
  );
}

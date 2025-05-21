import { Outlet } from "react-router";
import Navbar from "./navbar";

export default function AppLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

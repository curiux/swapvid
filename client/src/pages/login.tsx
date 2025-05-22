import LoginForm from "@/components/login-form";
import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * This component renders the login page.
 * If a user is already authenticated ("token" exists in localStorage),
 * it automatically redirects them to the home page using React Router's navigate function.
 * Otherwise, it displays the LoginForm centered on the screen.
 */
export default function Login() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token)
            navigate("/");
    }, []);

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-3 md:p-10">
            <div className="w-full max-w-md">
                <LoginForm />
            </div>
        </div>
    );
}
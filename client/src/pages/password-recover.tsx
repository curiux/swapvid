import PasswordRecoverForm from "@/components/password-recover-form";
import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * PasswordRecover page component
 * - Redirects authenticated users to the home page.
 * - Renders the PasswordRecoverForm for users to request password recovery.
 * - Uses react-router for navigation and useEffect for session check.
 */
export default function PasswordRecover() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token)
            navigate("/");
    }, []);

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-3 md:p-10">
            <div className="w-full max-w-md">
                <PasswordRecoverForm />
            </div>
        </div>
    );
}
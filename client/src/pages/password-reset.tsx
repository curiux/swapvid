import PasswordResetForm from "@/components/password-reset-form";
import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * PasswordReset page component
 * - Redirects authenticated users to the home page.
 * - Checks for a valid password reset token in the URL, redirects if missing.
 * - Renders the PasswordResetForm for users to reset their password.
 * - Uses react-router for navigation and useEffect for session/token check.
 */
export default function PasswordReset() {
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);

    useEffect(() => {
        const authToken = localStorage.getItem("token");
        if (authToken)
            navigate("/");

        const resetToken = params.get("token");
        if (!resetToken) {
            navigate("/");
            return;
        }
    }, []);

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-3 md:p-10">
            <div className="w-full max-w-md">
                <PasswordResetForm />
            </div>
        </div>
    );
}
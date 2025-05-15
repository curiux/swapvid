import RegisterForm from "@/components/register-form";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function Register() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token)
            navigate("/");
    }, []);

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <RegisterForm />
            </div>
        </div>
    );
}
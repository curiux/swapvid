import DeleteAccountForm from "@/components/delete-account-form";
import Spinner from "@/components/spinner";
import { API_URL } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

/**
 * This component renders the delete account page.
 * If the user is not authenticated (no "token" in localStorage),
 * it redirects to the home page. Otherwise, it fetches the user's data
 * and displays the DeleteAccountForm centered on the screen.
 * If the user is not found or the token is invalid, it redirects appropriately.
 */
export default function DeleteAccount() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        } else {
            getUserData(token);
        }
    }, []);

    const getUserData = async (token: String) => {
        try {
            const res = await fetch(API_URL + "/users/me", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.error) {
                if (res.status == 401 || res.status == 404) {
                    localStorage.removeItem("token");
                    navigate("/");
                } else {
                    navigate("/error?msg=" + encodeURIComponent(data.error));
                }
            } else {
                setUsername(data.username);
                setLoading(false);
            }
        } catch (e) {
            navigate("/error");
        }
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-3 md:p-10">
            <div className="w-full max-w-md">
                {loading ? (
                    <div className="w-full flex justify-center">
                        <Spinner className="w-14 h-14" />
                    </div>
                ) : (
                    <DeleteAccountForm username={username} />
                )}
            </div>
        </div>
    );
}
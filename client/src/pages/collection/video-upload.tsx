import Spinner from "@/components/spinner";
import VideoUploadForm from "@/components/video/video-upload-form";
import { API_URL } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

/**
 * VideoUpload page component
 * - Checks for user authentication and fetches subscription plan data.
 * - Redirects to home if not authenticated, or to error page on fetch error.
 * - Shows a loading spinner while fetching data.
 * - Renders the VideoUploadForm when ready.
 */
export default function VideoUpload() {
    const navigate = useNavigate();
    const [plan, setPlan] = useState("");
    const [loading, setLoading] = useState(true);

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
                    localStorage.clear();
                    navigate("/");
                } else {
                    navigate("/error?msg=" + encodeURIComponent(data.error));
                }
            } else {
                setPlan(data.subscription.plan);
                setLoading(false);
            }
        } catch (e) {
            navigate("/error");
        }
    }

    return (
        <div className="flex w-full items-center p-3">
            <div className="w-full max-w-4xl">
                {loading ? (
                    <div className="w-full flex justify-center">
                        <Spinner className="w-14 h-14" />
                    </div>
                ) : (
                    <VideoUploadForm plan={plan as any} />
                )}
            </div>
        </div>
    );
}
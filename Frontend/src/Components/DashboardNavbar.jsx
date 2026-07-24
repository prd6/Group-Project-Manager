import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo.svg?react";
import UserAvatar from "./UserAvatar";
import { API_ORIGIN } from "../services/apiConfig";

const DashboardNavbar = ({ fetchProfile = true }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user")) || null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        const handleUserUpdated = (event) => {
            setUser(event.detail);
        };

        window.addEventListener("user-updated", handleUserUpdated);

        return () => {
            window.removeEventListener("user-updated", handleUserUpdated);
        };
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("token");

            if (!token || !fetchProfile) return;

            try {
                const response = await fetch(`${API_ORIGIN}/api/users/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                    return;
                }

                if (!response.ok) return;

                const data = await response.json();
                setUser(data.user);
                localStorage.setItem("user", JSON.stringify(data.user));
            } catch (error) {
                console.log(error);
            }
        };

        fetchProfile();
    }, [fetchProfile, navigate]);

    return (
        <nav
            className="
                sticky top-0 z-50
                w-full
                border-b border-white/10
                bg-[#08080d]/80
                backdrop-blur-xl
            "
        >
            <div
                className="
                    flex h-16 max-w-full
                    items-center justify-between
                    px-5 sm:px-8 lg:px-10
                "
            >
                {/* Logo */}
                <button
                    onClick={() => navigate("/dashboard")}
                    className="flex items-center gap-3"
                >
                    <Logo className="h-9 w-9 text-white" />

                    <span className="hidden text-lg font-semibold text-white sm:block">
                        CodeGPM
                    </span>
                </button>

                {/* Profile */}
                <button
                    onClick={() => navigate("/profile")}
                    className="
                        mr-10
                        flex items-center gap-3
                        rounded-full
                        border border-violet-500/30
                        bg-violet-500/10
                        px-1.5 py-1
                        text-sm font-semibold
                        text-violet-300
                        transition-all duration-200
                        hover:border-violet-500/60
                        hover:bg-violet-500/20
                        hover:shadow-[0_0_20px_rgba(139,92,246,0.25)]
                    "
                >
                    <UserAvatar user={user} size="sm" />
                    <span className="hidden max-w-32 truncate pr-3 text-gray-200 sm:block">
                        {user?.name || "Profile"}
                    </span>
                </button>
            </div>
        </nav>
    );
};

export default DashboardNavbar;

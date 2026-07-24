import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo.svg?react";

const DashboardNavbar = () => {
    const navigate = useNavigate();

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
                        flex h-10 w-10
                        items-center justify-center
                        rounded-full
                        border border-violet-500/30
                        bg-violet-500/10
                        text-sm font-semibold
                        text-violet-300
                        transition-all duration-200
                        hover:border-violet-500/60
                        hover:bg-violet-500/20
                        hover:shadow-[0_0_20px_rgba(139,92,246,0.25)]
                    "
                >
                    P
                </button>
            </div>
        </nav>
    );
};

export default DashboardNavbar;
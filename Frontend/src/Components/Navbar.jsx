import { Link } from "react-router-dom";
import Logo from "../assets/logo.svg?react";

function Navbar() {
    return (
        <nav className="absolute top-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
            <div className="flex items-center justify-between px-8 py-4 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-5xl">

                {/* Logo */}
                <Link to="/">
                    <Logo className="w-11 h-11 text-white" />
                </Link>

                {/* Navigation */}
                <div className="hidden md:flex items-center gap-15 text-white font-medium">
                    <Link
                        to="/"
                        className="hover:text-violet-500 active:text-violet-800"
                    >
                        Home
                    </Link>

                    <Link
                        to="#about"
                        className="hover:text-violet-500 active:text-violet-800"
                    >
                        About
                    </Link>

                    <Link
                        to="#guide"
                        className="hover:text-violet-500 active:text-violet-800"
                    >
                        Guide
                    </Link>

                    <Link
                        to="#community"
                        className="hover:text-violet-500 active:text-violet-800"
                    >
                        Community
                    </Link>
                </div>

                {/* Button */}
                <Link to="/signup">
                    <button
                        className="
                            px-6 py-3
                            rounded-2xl
                            bg-violet-800
                            backdrop-blur-md
                            border border-violet-900
                            text-white
                            font-semibold
                            shadow-[0_0_20px_rgba(139,92,246,0.35)]
                        "
                    >
                        Get Started
                    </button>
                </Link>

            </div>
        </nav>
    );
}

export default Navbar;
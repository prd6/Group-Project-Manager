import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/logo.svg?react";

function Navbar() {
    const [activeSection, setActiveSection] = useState("home");

    const location = useLocation();
    const navigate = useNavigate();

    const sections = useMemo(() => ["home", "about", "guide", "community", "contact"], []);

    // Detect currently visible section
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200;

            let currentSection = "home";

            sections.forEach((section) => {
                const element = document.getElementById(section);

                if (
                    element &&
                    scrollPosition >= element.offsetTop
                ) {
                    currentSection = section;
                }
            });

            setActiveSection(currentSection);
        };

        window.addEventListener("scroll", handleScroll);

        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [sections]);

    // Scroll to section
    const scrollToSection = (section) => {
        if (location.pathname !== "/") {
            navigate(`/#${section}`);
            return;
        }

        const element = document.getElementById(section);

        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    const navClass = (section) =>
        `cursor-pointer transition-colors duration-200 ${activeSection === section
            ? "text-gray-300"
            : "text-white hover:text-gray-300"
        }`;

    return (
        <nav
            className="
                fixed
                top-5
                left-1/2
                -translate-x-1/2
                z-50
                w-[95%]
                max-w-7xl
            "
        >
            <div
                className="
                    flex
                    items-center
                    justify-between
                    px-8
                    py-4
                    rounded-3xl
                    border border-[#222]
                    bg-[#121212]
                    shadow-[0_16px_50px_rgba(0,0,0,0.35)]
                "
            >

                {/* Logo */}
                <Link to="/">
                    <Logo className="w-11 h-11 text-white" />
                </Link>

                {/* Navigation */}
                <div className="hidden md:flex items-center gap-15 font-medium">

                    <button
                        onClick={() => scrollToSection("home")}
                        className={navClass("home")}
                    >
                        Home
                    </button>

                    <button
                        onClick={() => scrollToSection("about")}
                        className={navClass("about")}
                    >
                        About
                    </button>

                    <button
                        onClick={() => scrollToSection("guide")}
                        className={navClass("guide")}
                    >
                        Guide
                    </button>

                    <button
                        onClick={() => scrollToSection("community")}
                        className={navClass("community")}
                    >
                        Community
                    </button>

                    <button
                        onClick={() => scrollToSection("contact")}
                        className={navClass("contact")}
                    >
                        Contact
                    </button>

                </div>

                {/* Get Started */}
                <Link to="/signup">
                    <button
                        className="
                            px-6 py-3
                            rounded-2xl
                            bg-white
                            text-black
                            font-semibold
                            transition
                            hover:bg-gray-200
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

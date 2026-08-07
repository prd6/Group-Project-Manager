import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/logo.svg?react";

function Navbar() {
    const [activeSection, setActiveSection] = useState("home");

    const location = useLocation();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    const sections = useMemo(() => ["home", "about", "guide", "community", "contact"], []);

    // Detect currently visible section
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 1);

            const scrollPosition = window.scrollY + 200;

            let currentSection = "home";

            sections.forEach((section) => {
                const element = document.getElementById(section);

                if (element && scrollPosition >= element.offsetTop) {
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

const navClass = (section) => {
    if (activeSection === section) {
        const gradient = scrolled
            ? "bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]"
            : "bg-[linear-gradient(180deg,_#a9caff_0%,_#b8cbff_16.667%,_#d3cbff_33.333%,_#f0c8f9_50%,_#ffc5f1_66.667%,_#ffc0ec_83.333%,_#ffbaec_100%)]";

        return `cursor-pointer transition-all duration-300 ${gradient} bg-clip-text text-transparent`;
    }

    return `cursor-pointer transition-all duration-300 ${
        scrolled
            ? "text-white hover:text-gray-600"
            : "text-black hover:text-gray-300"
    }`;
};

    return (
        <nav
            className="
                fixed
                top-0
                left-1/2
                -translate-x-1/2
                w-full
                z-50
                transition-all
                duration-300
            "
        >
            <div
                className={`
                    flex items-center justify-between h-18
                    px-8 py-4
                    transition-all duration-500

                ${scrolled ? "bg-[#212121] backdrop-blur-xl shadow-lg" : "bg-transparent"}`}>

                {/* Logo */}
                <Link className={`flex justify-center items-center transition-all duration-300

                    ${scrolled ? "text-white" : "text-black"}`}

                    to="/">

                    <Logo className="w-9 h-9" />
                    <p className="text-xl">
                        CodeGPM
                    </p>
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
                            rounded-full
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

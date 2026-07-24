import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ErrorPage = () => {
    const navigate = useNavigate();

    const [showTitle, setShowTitle] = useState(false);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const titleTimer = setTimeout(() => {
            setShowTitle(true);
        }, 400);

        const contentTimer = setTimeout(() => {
            setShowContent(true);
        }, 1400);

        return () => {
            clearTimeout(titleTimer);
            clearTimeout(contentTimer);
        };
    }, []);

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white">

            {/* Background */}

            <div
                className="
                    absolute
                    inset-0
                    bg-[radial-gradient(circle_at_center,#252525_0%,#090909_55%,#000_100%)]
                "
            />

            {/* Noise / scanline effect */}

            <div
                className="
                    pointer-events-none
                    absolute
                    inset-0
                    opacity-[0.08]

                    bg-[repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent_2px,
                        white_3px
                    )]
                "
            />

            {/* Vignette */}

            <div
                className="
                    pointer-events-none
                    absolute
                    inset-0
                    shadow-[inset_0_0_180px_80px_rgba(0,0,0,0.95)]
                "
            />

            {/* Main */}

            <main className="relative z-10 w-full px-6 text-center">

                {/* Dramatic title */}

                <div
                    className={`
                        transition-all
                        duration-1000

                        ${
                            showTitle
                                ? "scale-100 opacity-100 blur-0"
                                : "scale-125 opacity-0 blur-xl"
                        }
                    `}
                >
                    <h1
                        className="
                            select-none
                            text-[110px]
                            font-black
                            leading-none
                            tracking-[-0.07em]
                            text-white/90

                            sm:text-[160px]
                            md:text-[210px]

                            drop-shadow-[0_5px_15px_rgba(0,0,0,1)]
                        "
                    >
                        404
                    </h1>

                    <div
                        className="
                            mx-auto
                            mt-3
                            max-w-[600px]
                            border-y
                            border-red-600/40
                            py-3
                        "
                    >
                        <h2
                            className="
                                text-2xl
                                font-bold
                                uppercase
                                tracking-[0.25em]
                                text-red-600
                                sm:text-3xl
                            "
                        >
                            Wasted
                        </h2>
                    </div>
                </div>

                {/* Secondary content */}

                <div
                    className={`
                        transition-all
                        duration-700

                        ${
                            showContent
                                ? "translate-y-0 opacity-100"
                                : "translate-y-5 opacity-0"
                        }
                    `}
                >
                    <p
                        className="
                            mx-auto
                            mt-7
                            max-w-md
                            text-sm
                            leading-6
                            text-white/40
                        "
                    >
                        You went somewhere you weren't
                        supposed to.
                    </p>

                    <p
                        className="
                            mx-auto
                            mt-3
                            max-w-lg
                            break-all
                            font-mono
                            text-xs
                            text-white/20
                        "
                    >
                        {window.location.pathname}
                    </p>

                    {/* Buttons */}

                    <div
                        className="
                            mt-10
                            flex
                            flex-col
                            items-center
                            justify-center
                            gap-3

                            sm:flex-row
                        "
                    >
                        <button
                            onClick={() =>
                                navigate("/")
                            }
                            className="
                                min-w-[180px]
                                border
                                border-white/20
                                bg-white/10
                                px-6
                                py-3

                                text-xs
                                font-bold
                                uppercase
                                tracking-[0.15em]
                                text-white

                                transition

                                hover:border-white/40
                                hover:bg-white/20
                            "
                        >
                            Respawn
                        </button>
                    </div>

                    <p
                        className="
                            mt-12
                            text-[10px]
                            tracking-[0.35em]
                            text-white/15
                        "
                    >
                        CodeGPM
                    </p>
                </div>
            </main>

            {/* Red flash on load */}

            <div
                className="
                    pointer-events-none
                    absolute
                    inset-0
                    z-20

                    animate-[errorFlash_1.2s_ease-out_forwards]

                    bg-red-900/20
                "
            />

            <style>
                {`
                    @keyframes errorFlash {
                        0% {
                            opacity: 0.8;
                        }

                        30% {
                            opacity: 0.25;
                        }

                        100% {
                            opacity: 0;
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default ErrorPage;
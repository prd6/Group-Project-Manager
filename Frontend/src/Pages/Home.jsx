import { Link } from "react-router-dom";
import Particles from "../Styles/Particles";

function Home() {
    return (
        <div className="relative isolate min-h-screen overflow-hidden">

            {/* Particles Background */}
            <div className="absolute inset-0 z-0">
                <Particles
                    particleColors={["#ffffff"]}
                    particleCount={300}
                    particleSpread={10}
                    speed={0.2}
                    particleBaseSize={70}
                    moveParticlesOnHover={true}
                    particleHoverFactor={0.35}
                    alphaParticles={true}
                    disableRotation={false}
                    pixelRatio={1}
                    className="w-full h-full"
                />
            </div>

            {/* Hero Content */}
            <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
                <div className="max-w-3xl text-center">

                    <h1 className="text-6xl font-bold text-white">
                        Manage Your Group Projects
                    </h1>

                    <p className="mt-6 text-xl text-gray-300">
                        Create a group, invite teammates, upload files,
                        assign tasks, and collaborate from one workspace.
                    </p>

                    <div className="mt-10 flex justify-center gap-5">

                        <Link to="/signup">
                            <button className="rounded-xl bg-white px-8 py-4 font-bold text-black">
                                Get Started
                            </button>
                        </Link>

                        <Link to="/login">
                            <button
                                className="
                                    rounded-2xl
                                    border border-violet-700/90
                                    bg-violet-700
                                    backdrop-blur-xl
                                    px-8 py-4
                                    font-medium text-white
                                    hover:bg-violet-800/90
                                    hover:border-violet-800/90
                                    transition-all
                                    duration-300"
                            >
                                Sign In
                            </button>
                        </Link>

                    </div>
                </div>
            </div>

        </div>
    );
}

export default Home;

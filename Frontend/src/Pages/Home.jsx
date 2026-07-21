import { Link } from "react-router-dom";

function Home() {
    return (
        <div className="min-h-[calc(100vh-5rem)] bg-violet-50 flex items-center justify-center px-6">
            <div className="max-w-3xl text-center">
                <h1 className="text-5xl font-bold text-violet-900 mb-6">
                    Manage Your Group Projects Easily
                </h1>

                <p className="text-lg text-gray-900 leading-8 mb-10">
                    Create a group, invite your teammates with a unique group key,
                    upload project files, share updates, and collaborate in one
                    place. Stay organized and complete your projects together with
                    ease.
                </p>

                <div className="flex justify-center gap-6">
                    <Link to="/signup">
                        <button className="bg-violet-800 hover:bg-violet-900 text-white text-lg font-semibold px-8 py-4 rounded-xl transition duration-300">
                            Get Started
                        </button>
                    </Link>

                    <Link to="/login">
                        <button className="border-2 border-violet-800 text-violet-800 hover:bg-violet-800 hover:text-white text-lg font-semibold px-8 py-4 rounded-xl transition duration-300">
                            Login
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Home;
import { Link } from "react-router-dom";
import Logo from "../assets/logo.svg?react"

function Navbar() {
    return (
        <div className="bg-violet-800 text-white w-full h-20 mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">
                <Logo className="w-12 h-12 text-white" />
            </h1>

            <div className="flex justify-end gap-10">
                <div className="flex items-center gap-10">
                    <Link to="/" className="hover:text-violet-200 transition">
                        Home
                    </Link>

                    <Link to="/about" className="hover:text-violet-200 transition">
                        About
                    </Link>

                    <Link to="/guide" className="hover:text-violet-200 transition">
                        Guide
                    </Link>

                    <Link to="/community" className="hover:text-violet-200 transition">
                        Community
                    </Link>
                </div>

                <Link to="/signup">
                    <button className="bg-violet-950 p-4 rounded-2xl hover:bg-violet-900 transition">
                        Get Started
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default Navbar;
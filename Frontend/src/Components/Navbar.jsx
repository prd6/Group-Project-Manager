function Navbar() {
    return (
        <div className="bg-violet-800 text-white w-full h-20 mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Logo</h1>

            <div className="flex justify-end gap-10">
                <div className="flex items-center gap-10">
                    <a href="" className="">
                        About
                    </a>
                    <a href="" className="">
                        Guide
                    </a>
                    <a href="" className="">
                        Community
                    </a>
                </div>

                <button className="bg-violet-950 p-4 rounded-2xl">
                    Get Started
                </button>
            </div>

        </div>
    );
}

export default Navbar;
import React from "react";

const Dashboard = () => {
    return (
        <div className="min-h-screen bg-gray-100">

            {/* Navbar */}
            <nav className="bg-blue-600 text-white p-4 flex justify-between">
                <h1 className="text-xl font-bold">Group Project Manager</h1>

                <button className="bg-red-500 px-3 py-1 rounded">
                    Logout
                </button>
            </nav>

            <div className="p-6">

                {/* Welcome */}
                <div className="flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold ">
                        Welcome
                    </h2>

                    <p className="text-gray-600 mb-6">
                        Manage your project groups here.
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-4 mb-8">

                        <button className="bg-blue-500 text-white px-4 py-2 rounded">
                            Create Group
                        </button>

                        <button className="bg-green-500 text-white px-4 py-2 rounded">
                            Join Group
                        </button>

                    </div>
                </div>

                {/* My Groups */}
                <div className="bg-white p-5 rounded shadow mb-6">

                    <h3 className="text-xl font-semibold mb-3">
                        My Groups
                    </h3>

                    <div className="border rounded p-3 mb-3">

                        <h4 className="font-bold">
                            Software Engineering Project
                        </h4>

                        <p>Join Code: ABX93K</p>

                        <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded">
                            Open
                        </button>

                    </div>

                    <div className="border rounded p-3">

                        <h4 className="font-bold">
                            AI Mini Project
                        </h4>

                        <p>Join Code: ZX91KP</p>

                        <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded">
                            Open
                        </button>

                    </div>

                </div>

                {/* Recent Activity */}

                <div className="bg-white p-5 rounded shadow">

                    <h3 className="text-xl font-semibold mb-3">
                        Recent Activity
                    </h3>

                    <ul className="list-disc ml-5">
                        <li>Rahul uploaded database.sql</li>
                        <li>Priya joined the project</li>
                        <li>New version uploaded</li>
                    </ul>

                </div>

            </div>

        </div>
    );
};

export default Dashboard;
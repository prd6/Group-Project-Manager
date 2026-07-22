import React from "react";

const Workspace = () => {
  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-blue-600 text-white p-5 shadow">
        <h1 className="text-3xl font-bold">
          Project Workspace
        </h1>
        <p className="text-sm mt-1">
          Manage your project and collaborate with your teammates.
        </p>
      </div>

      <div className="max-w-6xl mx-auto p-6">

        {/* Project Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">

          <h2 className="text-2xl font-bold mb-4">
            Software Engineering Project
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <p className="font-semibold">Group Name</p>
              <p>Team Alpha</p>
            </div>

            <div>
              <p className="font-semibold">Join Code</p>
              <p>ABX93K</p>
            </div>

            <div>
              <p className="font-semibold">Owner</p>
              <p>Sabarna Das</p>
            </div>

            <div>
              <p className="font-semibold">Deadline</p>
              <p>25 August 2026</p>
            </div>

          </div>

          <div className="mt-5">

            <p className="font-semibold">Description</p>

            <p className="text-gray-600 mt-2">
              This project is developed to help students manage group projects,
              share files, maintain versions, and collaborate efficiently.
            </p>

          </div>

        </div>

        {/* Members */}

        <div className="bg-white rounded-lg shadow p-6 mb-6">

          <h2 className="text-xl font-bold mb-4">
            Members
          </h2>

          <ul className="space-y-3">

            <li className="border rounded p-3 flex justify-between">
              <span>Sabarna Das</span>
              <span className="text-blue-600 font-semibold">
                Owner
              </span>
            </li>

            <li className="border rounded p-3 flex justify-between">
              <span>Rahul Sharma</span>
              <span>Member</span>
            </li>

            <li className="border rounded p-3 flex justify-between">
              <span>Priya Roy</span>
              <span>Member</span>
            </li>

          </ul>

        </div>

        {/* Quick Actions */}

        <div className="bg-white rounded-lg shadow p-6">

          <h2 className="text-xl font-bold mb-5">
            Project Features
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            <button className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded">
              Upload Files
            </button>

            <button className="bg-green-500 hover:bg-green-600 text-white py-3 rounded">
              View Files
            </button>

            <button className="bg-purple-500 hover:bg-purple-600 text-white py-3 rounded">
              Version History
            </button>

            <button className="bg-orange-500 hover:bg-orange-600 text-white py-3 rounded">
              Code Showcase
            </button>

            <button className="bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded">
              Publish Project
            </button>

            <button className="bg-gray-700 hover:bg-black text-white py-3 rounded">
              GitHub Guide
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Workspace;
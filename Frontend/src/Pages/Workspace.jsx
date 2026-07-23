import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FileManager from "../Components/FileManager";

const Workspace = () => {
  const { id } = useParams();

  const [group, setGroup] = useState(null);

  // Fetch group details
  const fetchGroup = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/groups/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setGroup(data);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, []);

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

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
            {group.projectName || "No Project Name"}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <p className="font-semibold">Group Name</p>
              <p>{group.groupName}</p>
            </div>

            <div>
              <p className="font-semibold">Join Code</p>
              <p>{group.joinCode}</p>
            </div>

            <div>
              <p className="font-semibold">Owner</p>
              <p>
                {
                  group.members.find(
                    (member) => member.role === "Owner"
                  )?.user?.name
                }
              </p>
            </div>

            <div>
              <p className="font-semibold">Deadline</p>
              <p>
                {group.deadline
                  ? new Date(group.deadline).toLocaleDateString()
                  : "No Deadline"}
              </p>
            </div>

          </div>

          <div className="mt-5">

            <p className="font-semibold">
              Description
            </p>

            <p className="text-gray-600 mt-2">
              {group.description || "No description added."}
            </p>

          </div>

        </div>

        {/* Members */}

        <div className="bg-white rounded-lg shadow p-6 mb-6">

          <h2 className="text-xl font-bold mb-4">
            Members
          </h2>

          <ul className="space-y-3">

            {group.members
              .filter((member) => member.user)
              .map((member) => (

              <li
                key={member.user._id}
                className="border rounded p-3 flex justify-between"
              >

                <span>
                  {member.user.name}
                </span>

                <span
                  className={
                    member.role === "Owner"
                      ? "text-blue-600 font-semibold"
                      : ""
                  }
                >
                  {member.role}
                </span>

              </li>

            ))}

          </ul>

        </div>

        {/* Quick Actions */}

        <div className="bg-white rounded-lg shadow p-6">

          <h2 className="text-xl font-bold mb-5">
            Project Features
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            <FileManager groupId={group._id} />

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
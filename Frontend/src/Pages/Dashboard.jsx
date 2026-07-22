import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);

  // Fetch groups from backend
  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/groups/my-groups",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setGroups(data);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Load groups when Dashboard opens
  useEffect(() => {
    fetchGroups();
  }, []);

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
          <h2 className="text-2xl font-bold">
            Welcome
          </h2>

          <p className="text-gray-600 mb-6">
            Manage your project groups here.
          </p>

          <div className="flex gap-4 mb-8">

            <button
              onClick={() => navigate("/Create_Grp")}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Create Group
            </button>

            <button
              onClick={() => navigate("/Join_Grp")}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Join Group
            </button>

          </div>
        </div>

        {/* My Groups */}
        <div className="bg-white p-5 rounded shadow mb-6">

          <h3 className="text-xl font-semibold mb-3">
            My Groups
          </h3>

          {groups.length === 0 ? (

            <p className="text-gray-500">
              No groups found.
            </p>

          ) : (

            groups.map((group) => (

              <div
                key={group._id}
                className="border rounded p-3 mb-3"
              >

                <h4 className="font-bold text-lg">
                  {group.groupName}
                </h4>

                <p>
                  <strong>Project:</strong> {group.projectName}
                </p>

                <p>
                  <strong>Join Code:</strong> {group.joinCode}
                </p>

                <button
                    onClick={() => navigate(`/workspace/${group._id}`)}
                    className="mt-2 bg-blue-500 text-white px-3 py-1 rounded"
                >
                    Open
                </button>

              </div>

            ))

          )}

        </div>

        {/* Recent Activity */}

        <div className="bg-white p-5 rounded shadow">

          <h3 className="text-xl font-semibold mb-3">
            Recent Activity :
          </h3>

          <ul className="list-disc ml-5">
            <p>NO RECENT ACTIVITY FOUND !</p>
          </ul>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
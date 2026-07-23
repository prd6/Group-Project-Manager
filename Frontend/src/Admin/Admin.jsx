import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    groups: 0,
    files: 0,
    tasks: 0,
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/admin/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setStats(data.stats);
        } else {
          console.log(data.message);
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-violet-700 mb-8">
        Admin Dashboard
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Total Users</h2>
          <p className="text-3xl font-bold mt-2">{stats.users}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Groups</h2>
          <p className="text-3xl font-bold mt-2">{stats.groups}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Files</h2>
          <p className="text-3xl font-bold mt-2">{stats.files}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Tasks</h2>
          <p className="text-3xl font-bold mt-2">{stats.tasks}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/admin/users")}
            className="bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 transition"
          >
            Manage Users
          </button>

          <button
            onClick={() => navigate("/admin/groups")}
            className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
            Manage Groups
          </button>

          <button
            onClick={() => navigate("/admin/files")}
            className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
          >
            View Files
          </button>

          <button className="bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition">
            Reports
          </button>
        </div>
      </div>
    </div>
  );
}

export default Admin;
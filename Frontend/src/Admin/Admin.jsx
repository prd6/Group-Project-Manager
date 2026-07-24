import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Admin() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    users: 0,
    groups: 0,
    files: 0,
    storage: 0,
  });

  const STORAGE_LIMIT = 500 * 1024 * 1024; // 500 MB

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

  const storagePercentage = Math.min(
    (stats.storage / STORAGE_LIMIT) * 100,
    100
  );

  const formatStorage = (bytes) => {
    if (!bytes) return "0 MB";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      {/* Header */}
      <h1 className="text-4xl font-bold text-violet-700 mb-8">
        Admin Dashboard
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">
            Total Users
          </h2>

          <p className="text-3xl font-bold mt-2">
            {stats.users}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">
            Groups
          </h2>

          <p className="text-3xl font-bold mt-2">
            {stats.groups}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">
            Files
          </h2>

          <p className="text-3xl font-bold mt-2">
            {stats.files}
          </p>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">

        <h2 className="text-2xl font-semibold mb-6">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          <button
            onClick={() => navigate("/admin/users")}
            className="bg-violet-600 py-4 text-white rounded-lg hover:bg-violet-700 transition"
          >
            Manage Users
          </button>

          <button
            onClick={() => navigate("/admin/groups")}
            className="bg-blue-600 py-4 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Manage Groups
          </button>

          <button
            onClick={() => navigate("/admin/files")}
            className="bg-green-600 py-4 text-white rounded-lg hover:bg-green-700 transition"
          >
            View Files
          </button>

          <button
            onClick={() => navigate("/admin/storage")}
            className="bg-orange-600 py-4 text-white rounded-lg hover:bg-orange-700 transition"
          >
            View Storage
          </button>

        </div>
      </div>

      {/* Total Storage */}
      <div className="bg-white rounded-xl shadow p-6">

        <div className="flex justify-between items-center mb-3">

          <h2 className="text-xl font-semibold text-gray-800">
            Total Storage
          </h2>

          <span className="text-sm font-medium text-gray-500">
            {storagePercentage.toFixed(1)}%
          </span>

        </div>

        <div className="flex items-end gap-2 mb-4">

          <p className="text-3xl font-bold">
            {formatStorage(stats.storage)}
          </p>

          <span className="text-gray-500 mb-1">
            / 500 MB
          </span>

        </div>

        {/* Storage Bar */}
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">

          <div
            className="h-full bg-violet-600 rounded-full transition-all duration-500"
            style={{
              width: `${storagePercentage}%`,
            }}
          />

        </div>

        {/* Storage Details */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">

          <span>
            {formatStorage(stats.storage)} used
          </span>

          <span>
            {formatStorage(
              Math.max(STORAGE_LIMIT - stats.storage, 0)
            )}{" "}
            available
          </span>

        </div>

      </div>

    </div>
  );
}

export default Admin;
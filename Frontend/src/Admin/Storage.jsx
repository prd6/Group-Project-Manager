import { useEffect, useState } from "react";
import UserAvatar from "../Components/UserAvatar";

function Storage() {
  const [stats, setStats] = useState({
    storage: 0,
  });

  const [userStorage, setUserStorage] = useState([]);
  const [loading, setLoading] = useState(true);

  // 500 MB total storage
  const STORAGE_LIMIT = 500 * 1024 * 1024;
  const USER_STORAGE_LIMIT = 20 * 1024 * 1024; // 20 MB per user

  useEffect(() => {
    const fetchStorage = async () => {
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
          setUserStorage(data.userStorage || []);
        } else {
          console.log(data.message);
        }
      } catch (error) {
        console.error("Error fetching storage:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStorage();
  }, []);

  // Convert bytes to B / KB / MB / GB
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

  // Total storage percentage
  const storagePercentage = Math.min(
    (stats.storage / STORAGE_LIMIT) * 100,
    100
  );

  // Remaining storage
  const remainingStorage = Math.max(
    STORAGE_LIMIT - stats.storage,
    0
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-violet-700">
          Storage Management
        </h1>

        <p className="text-gray-500 mt-2">
          Monitor total storage and storage usage by users.
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="bg-white rounded-xl shadow p-10 text-center text-gray-500">
          Loading storage data...
        </div>
      ) : (
        <>
          {/* Total Storage */}
          <div className="bg-white rounded-xl shadow p-6 mb-8">

            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Total Storage
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Application file storage usage
                </p>
              </div>

              <span className="text-sm font-semibold text-violet-700 bg-violet-100 px-3 py-1 rounded-full">
                {storagePercentage.toFixed(1)}%
              </span>
            </div>

            {/* Storage Numbers */}
            <div className="flex items-end gap-2 mb-5">
              <p className="text-3xl font-bold text-gray-900">
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

            {/* Storage Information */}
            <div className="flex justify-between mt-3 text-sm text-gray-500">
              <span>
                {formatStorage(stats.storage)} used
              </span>

              <span>
                {formatStorage(remainingStorage)} available
              </span>
            </div>
          </div>

          {/* Storage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            {/* Used */}
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-sm text-gray-500">
                Storage Used
              </p>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatStorage(stats.storage)}
              </p>
            </div>

            {/* Available */}
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-sm text-gray-500">
                Available Storage
              </p>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatStorage(remainingStorage)}
              </p>
            </div>

            {/* Users Using Storage */}
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-sm text-gray-500">
                Users Using Storage
              </p>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                {userStorage.length}
              </p>
            </div>

          </div>

          {/* Storage Per User */}
          <div className="bg-white rounded-xl shadow overflow-hidden">

            {/* Header */}
            <div className="p-6 border-b">
              <h2 className="text-2xl font-semibold text-gray-800">
                Storage Usage Per User
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Storage consumed by files uploaded by each user
              </p>
            </div>

            {/* No Users */}
            {userStorage.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                No storage usage found.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">

                {userStorage.map((user) => {
                  const percentage = Math.min(
                    (user.storageUsed / USER_STORAGE_LIMIT) * 100,
                    100
                  );

                  return (
                    <div
                      key={user.userId}
                      className="p-6 hover:bg-gray-50 transition"
                    >

                      {/* User Info */}
                      <div className="flex justify-between items-center mb-4">

                        <div className="flex min-w-0 items-center gap-3">
                          <UserAvatar user={user} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">
                              {user.name || "Unknown User"}
                            </p>

                            <p className="mt-1 truncate text-sm text-gray-500">
                              {user.email || "No email"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatStorage(user.storageUsed)}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            {user.fileCount}{" "}
                            {user.fileCount === 1
                              ? "file"
                              : "files"}
                          </p>
                        </div>

                      </div>

                      {/* User Storage Bar */}
                      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      {/* User Storage Details */}
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>
                          {percentage.toFixed(2)}% of total storage
                        </span>

                        <span>
                          {formatStorage(user.storageUsed)} / {USER_STORAGE_LIMIT/1024/1024} MB
                        </span>
                      </div>

                    </div>
                  );
                })}

              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Storage;

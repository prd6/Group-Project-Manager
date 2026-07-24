import { useEffect, useState } from "react";

function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/admin/files",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setFiles(data.files);
        } else {
          console.log(data.message);
        }
      } catch (error) {
        console.error("Error fetching files:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date) => {
    if (!date) return "Unknown";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-violet-700">
          File Management
        </h1>

        <p className="text-gray-500 mt-2">
          View and manage files uploaded across all groups.
        </p>
      </div>

      {/* Files Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">

        {/* Table Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              All Files
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {files.length} {files.length === 1 ? "file" : "files"} uploaded
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Loading files...
          </div>
        ) : files.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">
              No files have been uploaded yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">

              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    File
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Size
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Uploaded By
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Group
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Uploaded
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {files.map((file) => (
                  <tr
                    key={file._id}
                    className="hover:bg-gray-50 transition"
                  >
                    {/* File */}
                    <td className="px-6 py-4">
                      <div className="max-w-70">
                        <p
                          className="font-medium text-gray-800 truncate"
                          title={file.originalName}
                        >
                          {file.originalName || file.fileName}
                        </p>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {file.fileType || "Unknown type"}
                          </span>

                          <span className="text-gray-300">
                            •
                          </span>

                          <span className="text-xs text-gray-500">
                            v{file.version || 1}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Size */}
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatFileSize(file.fileSize)}
                    </td>

                    {/* Uploaded By */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-800">
                        {file.uploadedBy?.name || "Unknown"}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {file.uploadedBy?.email || "No email"}
                      </p>
                    </td>

                    {/* Group */}
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-sm font-medium">
                        {file.group?.groupName || "Unknown"}
                      </span>
                    </td>

                    {/* Uploaded Date */}
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(file.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end items-center gap-4">
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-violet-600 hover:text-violet-800"
                        >
                          View
                        </a>

                        <button
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Files;
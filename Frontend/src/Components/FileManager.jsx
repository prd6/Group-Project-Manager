import { useEffect, useState } from "react";

const FileManager = ({ groupId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);

  // Load files
  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/files/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setFiles(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Upload
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `http://localhost:5000/api/files/upload/${groupId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("File Uploaded Successfully!");

        setSelectedFile(null);
        fetchFiles();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow mt-6 p-6">
      <h2 className="text-2xl font-bold mb-4">
        Files
      </h2>

      <div className="flex gap-3 mb-6">
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          className="border p-2 rounded w-full"
        />

        <button
          onClick={handleUpload}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded transition"
        >
          Upload
        </button>
      </div>

      <h3 className="font-semibold mb-3">
        Uploaded Files
      </h3>

      {files.length === 0 ? (
        <p>No files uploaded.</p>
      ) : (
        <div className="max-h-50 overflow-y-auto pr-2 space-y-3">
          {files.map((file) => (
            <div
              key={file._id}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <h4 className="font-semibold">
                  {file.originalName}
                </h4>

                <p className="text-sm text-gray-500">
                  Uploaded By : {file.uploadedBy?.name || "Unknown User"}
                </p>

                <p className="text-sm text-gray-500">
                  {(file.fileSize / 1024).toFixed(2)} KB
                </p>
              </div>

              <a
                href={`http://localhost:5000/${file.fileUrl}`}
                download
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileManager;
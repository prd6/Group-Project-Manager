import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import {
    FaFilePdf,
    FaFileImage,
    FaFileWord,
    FaFileExcel,
    FaFileArchive,
    FaFileAlt,
} from "react-icons/fa";
import UserAvatar from "../Components/UserAvatar";

const FilesPage = () => {
    const { groupId } = useParams();

    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

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
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getFileIcon = (fileType) => {
        if (!fileType) return <FaFileAlt className="text-gray-500 text-2xl" />;

        if (fileType.includes("pdf"))
            return <FaFilePdf className="text-red-600 text-2xl" />;

        if (fileType.startsWith("image/"))
            return <FaFileImage className="text-blue-600 text-2xl" />;

        if (fileType.includes("word"))
            return <FaFileWord className="text-blue-700 text-2xl" />;

        if (fileType.includes("excel") || fileType.includes("spreadsheet"))
            return <FaFileExcel className="text-green-700 text-2xl" />;

        if (
            fileType.includes("zip") ||
            fileType.includes("rar") ||
            fileType.includes("7z")
        )
            return <FaFileArchive className="text-yellow-600 text-2xl" />;

        return <FaFileAlt className="text-gray-500 text-2xl" />;
    };

    const filteredFiles = files.filter((file) =>
        file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalStorage = files.reduce(
        (total, file) => total + file.fileSize,
        0
    );

    const getFileUrl = (fileId) =>
        `http://localhost:5000/api/files/view/${fileId}`;

    const getDownloadUrl = (fileId) =>
        `http://localhost:5000/api/files/download/${fileId}`;

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="bg-white rounded-xl shadow-lg h-[85vh] flex overflow-hidden">

                {/* Left Panel */}
                <div className="w-[28%] border-r bg-gray-50 flex flex-col">

                    <div className="p-5 border-b bg-white">

                        <h2 className="text-2xl font-bold">
                            📁 Project Files
                        </h2>

                        <div className="mt-4 space-y-2">

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                    Total Files
                                </span>

                                <span className="font-semibold">
                                    {files.length}
                                </span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                    Storage Used
                                </span>

                                <span className="font-semibold">
                                    {(totalStorage / (1024 * 1024)).toFixed(2)} MB
                                </span>
                            </div>

                        </div>

                    </div>

                    <div className="p-3 border-b bg-white">
                        <input
                            type="text"
                            placeholder="🔍 Search files..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {files.length === 0 ? (
                            <p className="text-gray-500">
                                No files found.
                            </p>
                        ) : (
                            filteredFiles.map((file) => (
                                <div
                                    key={file._id}
                                    onClick={() => setSelectedFile(file)}
                                    className={`cursor-pointer rounded-xl border transition-all duration-300 ${selectedFile?._id === file._id
                                        ? "border-blue-600 bg-blue-50 shadow-md"
                                        : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                                        }`}
                                >
                                    <div className="flex items-start gap-4 p-4">

                                        {/* File Icon */}
                                        <div className="mt-1">
                                            {getFileIcon(file.fileType)}
                                        </div>

                                        {/* File Details */}
                                        <div className="flex-1">

                                            <div className="flex justify-between items-start">

                                                <h3 className="font-semibold text-gray-800 break-all">
                                                    {file.originalName}
                                                </h3>

                                                {selectedFile?._id === file._id && (
                                                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                                        Selected
                                                    </span>
                                                )}

                                            </div>

                                            <div className="mt-2 space-y-1 text-sm text-gray-500">

                                                <div className="flex items-center gap-2">
                                                    <UserAvatar user={file.uploadedBy} size="sm" />
                                                    <span>{file.uploadedBy?.name || "Unknown User"}</span>
                                                </div>

                                                <p>
                                                    💾 {(file.fileSize / 1024).toFixed(2)} KB
                                                </p>

                                                <p>
                                                    🕒 {new Date(file.createdAt).toLocaleString()}
                                                </p>

                                            </div>

                                        </div>

                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>

                {/* Right Panel */}
                <div className="flex-1 p-8">

                    {!selectedFile ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-gray-700">
                                    File Preview
                                </h2>

                                <p className="text-gray-500 mt-3">
                                    Select a file from the left.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col bg-white rounded-xl overflow-hidden shadow">

                            {/* Header */}
                            <div className="border-b p-6">

                                <div className="flex items-center gap-4">

                                    {getFileIcon(selectedFile.fileType)}

                                    <div>
                                        <h2 className="text-2xl font-bold break-all">
                                            {selectedFile.originalName}
                                        </h2>

                                        <p className="text-gray-500">
                                            Project Document
                                        </p>
                                    </div>

                                </div>

                                <div className="grid grid-cols-2 gap-5 mt-6">

                                    <div>
                                        <p className="text-sm text-gray-500">Uploaded By</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <UserAvatar user={selectedFile.uploadedBy} size="sm" />
                                            <p className="font-semibold">
                                                {selectedFile.uploadedBy?.name || "Unknown User"}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">File Size</p>
                                        <p className="font-semibold">
                                            {(selectedFile.fileSize / 1024).toFixed(2)} KB
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">Uploaded On</p>
                                        <p className="font-semibold">
                                            {new Date(selectedFile.createdAt).toLocaleString()}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">File Type</p>
                                        <p className="font-semibold break-all">
                                            {selectedFile.fileType}
                                        </p>
                                    </div>

                                </div>

                                <div className="flex gap-3 mt-6">

                                    <button
                                        onClick={() => setPreviewFile(selectedFile)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
                                    >
                                        Open File
                                    </button>

                                    <a
                                        href={getDownloadUrl(selectedFile.fileUrl)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition"
                                    >
                                        Download
                                    </a>

                                </div>

                            </div>

                            {/* Preview */}
                            <div className="flex-1 bg-gray-100 p-6 overflow-auto">

                                {!previewFile ? (

                                    <div className="h-full flex items-center justify-center text-gray-500">
                                        Click <strong className="mx-1">Open File</strong> to preview.
                                    </div>

                                ) : previewFile.fileType.startsWith("image/") ? (

                                    <img
                                        src={getFileUrl(previewFile.fileUrl)}
                                        alt={previewFile.originalName}
                                        className="max-w-full max-h-full mx-auto rounded-lg shadow"
                                    />

                                ) : previewFile.fileType.includes("pdf") ? (

                                    <iframe
                                        src={getFileUrl(previewFile.fileUrl)}
                                        title="PDF Preview"
                                        className="w-full h-full rounded-lg bg-white"
                                    />

                                ) : (

                                    <div className="h-full flex flex-col items-center justify-center gap-4">

                                        {getFileIcon(previewFile.fileType)}

                                        <p className="text-gray-600">
                                            Preview isn't available for this file type.
                                        </p>

                                        <a
                                            href={getDownloadUrl(previewFile.fileUrl)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                                        >
                                            Download File
                                        </a>

                                    </div>

                                )}

                            </div>

                        </div>
                    )}

                </div>

            </div>
        </div>
    );
};

export default FilesPage;

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import UserAvatar from "./UserAvatar";
import {
    buildApiUrl,
    parseApiResponse,
} from "../services/apiConfig";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

const FileManager = ({ groupId }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [files, setFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const fileInputRef = useRef(null);

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // ==========================================
    // LOAD FILES
    // ==========================================

    const fetchFiles = async () => {
        if (!groupId) {
            setFiles([]);
            setError("Workspace ID is missing.");
            setLoadingFiles(false);
            return;
        }

        try {
            setLoadingFiles(true);
            setError("");

            const token = localStorage.getItem("token");

            const response = await fetch(
                buildApiUrl(`/api/files/${groupId}`),
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const { data, errorMessage } =
                await parseApiResponse(response);

            if (response.ok) {
                setFiles(
                    Array.isArray(data)
                        ? data
                        : []
                );
            } else {
                throw new Error(
                    errorMessage ||
                        "Failed to load files."
                );
            }
        } catch (error) {
            console.error("Failed to load files:", error);
            setFiles([]);
            setError(
                error.message ||
                    "Failed to load files."
            );
        } finally {
            setLoadingFiles(false);
        }
    };

    useEffect(() => {
        if (groupId) {
            const timer = window.setTimeout(() => {
                fetchFiles();
            }, 0);

            return () => window.clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId]);

    // ==========================================
    // OPEN FILE PICKER FROM WORKSPACE
    // ==========================================

    useEffect(() => {
        if (searchParams.get("upload") === "true") {
            // Small delay allows the input to mount first.
            const timer = setTimeout(() => {
                fileInputRef.current?.click();

                const nextParams =
                    new URLSearchParams(
                        searchParams
                    );

                nextParams.delete("upload");

                setSearchParams(nextParams, {
                    replace: true,
                });
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [searchParams, setSearchParams]);

    // ==========================================
    // SELECT FILE + 1 MB VALIDATION
    // ==========================================

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError(
                "File is too large. Maximum file size is 1 MB."
            );

            setSelectedFile(null);
            setSuccessMessage("");

            // Reset input so same file can be selected again.
            event.target.value = "";

            return;
        }

        setError("");
        setSuccessMessage("");
        setSelectedFile(file);
    };

    // ==========================================
    // UPLOAD
    // ==========================================

    const handleUpload = async () => {
        if (!selectedFile) {
            setError("Please select a file.");
            return;
        }

        // Check again before uploading.
        if (selectedFile.size > MAX_FILE_SIZE) {
            setError(
                "File is too large. Maximum file size is 1 MB."
            );
            return;
        }

        try {
            setUploading(true);
            setError("");
            setSuccessMessage("");

            const token = localStorage.getItem("token");

            const formData = new FormData();

            formData.append(
                "file",
                selectedFile
            );

            const response = await fetch(
                buildApiUrl(
                    `/api/files/upload/${groupId}`
                ),
                {
                    method: "POST",

                    headers: {
                        Authorization: `Bearer ${token}`,
                    },

                    body: formData,
                }
            );

            const { errorMessage } =
                await parseApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    errorMessage ||
                        "File upload failed."
                );
            }

            setSuccessMessage(
                "File uploaded successfully."
            );

            setSelectedFile(null);

            // Reset actual file input.
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            await fetchFiles();

        } catch (error) {
            console.error(
                "File upload failed:",
                error
            );

            setError(
                error.message ||
                    "Failed to upload file."
            );
        } finally {
            setUploading(false);
        }
    };

    // ==========================================
    // FORMAT FILE SIZE
    // ==========================================

    const formatFileSize = (bytes) => {
        if (!bytes) {
            return "0 KB";
        }

        if (bytes >= 1024 * 1024) {
            return `${(
                bytes /
                (1024 * 1024)
            ).toFixed(2)} MB`;
        }

        return `${(
            bytes / 1024
        ).toFixed(2)} KB`;
    };

    return (
        <div className="mt-6 rounded-xl bg-white p-6 shadow">

            <h2 className="mb-4 text-2xl font-bold">
                Files
            </h2>

            {/* ==================================
                FILE UPLOAD
            ================================== */}

            <div className="mb-2 flex gap-3">

                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="w-full rounded border p-2"
                />

                <button
                    type="button"
                    onClick={handleUpload}
                    disabled={
                        uploading ||
                        !selectedFile
                    }
                    className="
                        rounded
                        bg-gray-600
                        px-5
                        text-white
                        transition
                        hover:bg-gray-700
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                >
                    {uploading
                        ? "Uploading..."
                        : "Upload"}
                </button>

            </div>

            {/* LIMIT */}

            <p className="mb-6 text-xs text-gray-500">
                Maximum file size: 1 MB
            </p>

            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}

            {!error && successMessage && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    {successMessage}
                </div>
            )}

            {/* SELECTED FILE */}

            {selectedFile && (
                <div className="mb-6 rounded-lg bg-gray-100 p-3">

                    <p className="text-sm font-medium text-gray-800">
                        {selectedFile.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                        {formatFileSize(
                            selectedFile.size
                        )}
                    </p>

                </div>
            )}

            {/* ==================================
                UPLOADED FILES
            ================================== */}

            <h3 className="mb-3 font-semibold">
                Uploaded Files
            </h3>

            {loadingFiles ? (
                <p className="text-gray-500">
                    Loading files...
                </p>
            ) : files.length === 0 ? (
                <p className="text-gray-500">
                    No files uploaded.
                </p>
            ) : (
                <div className="max-h-50 space-y-3 overflow-y-auto pr-2">

                    {files.map((file) => (
                        <div
                            key={file._id}
                            className="
                                flex
                                items-center
                                justify-between
                                rounded-lg
                                border
                                p-4
                            "
                        >

                            <div>

                                <h4 className="font-semibold">
                                    {file.originalName}
                                </h4>

                                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">

                                    <UserAvatar
                                        user={
                                            file.uploadedBy
                                        }
                                        size="sm"
                                    />

                                    <span>
                                        Uploaded By:{" "}
                                        {file.uploadedBy
                                            ?.name ||
                                            "Unknown User"}
                                    </span>

                                </div>

                                <p className="mt-1 text-sm text-gray-500">
                                    {formatFileSize(
                                        file.fileSize
                                    )}
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        `/workspace/${groupId}/files`
                                    )
                                }
                                className="
                                    rounded
                                    bg-gray-600
                                    px-4
                                    py-2
                                    text-white
                                    transition
                                    hover:bg-gray-700
                                "
                            >
                                View Files
                            </button>

                        </div>
                    ))}

                </div>
            )}

        </div>
    );
};

export default FileManager;

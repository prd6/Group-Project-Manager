import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Archive,
    File,
    FileCode2,
    FileImage,
    FileText,
    Files as FilesIcon,
    FolderKanban,
    HardDrive,
    RefreshCw,
    Search,
    Trash2,
    ExternalLink,
    Upload,
    X,
} from "lucide-react";

import UserAvatar from "../Components/UserAvatar";
import { API_ORIGIN } from "../services/apiConfig";

function Files() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    // ==========================================
    // FETCH FILES
    // ==========================================

    const fetchFiles = useCallback(async (refresh = false) => {
        try {
            if (refresh) {
                setRefreshing(true);
            }

            setError("");

            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_ORIGIN}/api/admin/files`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load files."
                );
            }

            if (data.success) {
                setFiles(data.files || []);
            }
        } catch (error) {
            console.error("Error fetching files:", error);

            setError(
                error.message ||
                    "Something went wrong while loading files."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    // ==========================================
    // FORMAT FILE SIZE
    // ==========================================

    const formatFileSize = (bytes = 0) => {
        if (!bytes) return "0 KB";

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        }

        if (bytes < 1024 * 1024 * 1024) {
            return `${(
                bytes /
                (1024 * 1024)
            ).toFixed(2)} MB`;
        }

        return `${(
            bytes /
            (1024 * 1024 * 1024)
        ).toFixed(2)} GB`;
    };

    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (date) => {
        if (!date) return "Unknown";

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    // ==========================================
    // FILE ICON
    // ==========================================

    const getFileIcon = (file) => {
        const type = (
            file.fileType ||
            file.originalName ||
            file.fileName ||
            ""
        ).toLowerCase();

        if (
            type.includes("image") ||
            /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(type)
        ) {
            return FileImage;
        }

        if (
            type.includes("pdf") ||
            type.includes("document") ||
            /\.(pdf|doc|docx|txt)$/i.test(type)
        ) {
            return FileText;
        }

        if (
            /\.(js|jsx|ts|tsx|html|css|py|java|cpp|c|json)$/i.test(
                type
            )
        ) {
            return FileCode2;
        }

        if (
            type.includes("zip") ||
            type.includes("rar") ||
            /\.(zip|rar|7z)$/i.test(type)
        ) {
            return Archive;
        }

        return File;
    };

    // ==========================================
    // FILTER FILES
    // ==========================================

    const filteredFiles = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return files;
        }

        return files.filter((file) => {
            const fileName =
                file.originalName ||
                file.fileName ||
                "";

            const uploader =
                file.uploadedBy?.name || "";

            const email =
                file.uploadedBy?.email || "";

            const group =
                file.group?.groupName || "";

            const type =
                file.fileType || "";

            return (
                fileName
                    .toLowerCase()
                    .includes(query) ||
                uploader
                    .toLowerCase()
                    .includes(query) ||
                email
                    .toLowerCase()
                    .includes(query) ||
                group
                    .toLowerCase()
                    .includes(query) ||
                type
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [files, search]);

    // ==========================================
    // STATS
    // ==========================================

    const totalStorage = useMemo(() => {
        return files.reduce(
            (total, file) =>
                total + (file.fileSize || 0),
            0
        );
    }, [files]);

    const totalGroups = useMemo(() => {
        const groups = new Set();

        files.forEach((file) => {
            const groupId =
                file.group?._id ||
                file.group?.groupName;

            if (groupId) {
                groups.add(groupId);
            }
        });

        return groups.size;
    }, [files]);

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#08080d] text-white">
                <div className="text-center">

                    <RefreshCw className="mx-auto h-7 w-7 animate-spin text-violet-500" />

                    <p className="mt-4 text-sm text-gray-500">
                        Loading files...
                    </p>

                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#08080d] text-white">

            {/* ==================================
                BACKGROUND
            ================================== */}

            <div className="pointer-events-none fixed inset-0 overflow-hidden">

                <div
                    className="
                        absolute
                        -left-40
                        -top-40
                        h-125
                        w-125
                        rounded-full
                        bg-violet-700/8
                        blur-[150px]
                    "
                />

                <div
                    className="
                        absolute
                        bottom-0
                        right-0
                        h-100
                        w-100
                        rounded-full
                        bg-purple-800/5
                        blur-[140px]
                    "
                />

            </div>

            <main className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">

                {/* ==================================
                    HEADER
                ================================== */}

                <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

                    <div>

                        <div className="mb-3 flex items-center gap-2">

                            <FilesIcon
                                size={15}
                                className="text-violet-400"
                            />

                            <p className="text-sm font-medium text-violet-400">
                                Administration
                            </p>

                        </div>

                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            File Management
                        </h1>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
                            View and manage files uploaded
                            across all CodeGPM groups.
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            fetchFiles(true)
                        }
                        disabled={refreshing}
                        className="
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            border
                            border-white/10
                            bg-white/5
                            px-4
                            py-2.5
                            text-sm
                            text-gray-300
                            transition
                            hover:bg-white/10
                            hover:text-white
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >

                        <RefreshCw
                            size={15}
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        Refresh

                    </button>

                </header>

                {/* ==================================
                    ERROR
                ================================== */}

                {error && (
                    <div
                        className="
                            mb-6
                            flex
                            items-center
                            justify-between
                            gap-4
                            rounded-2xl
                            border
                            border-red-500/20
                            bg-red-500/10
                            px-5
                            py-4
                            text-sm
                            text-red-200
                        "
                    >

                        <span>{error}</span>

                        <button
                            onClick={() =>
                                setError("")
                            }
                            className="text-red-300 transition hover:text-white"
                        >
                            <X size={17} />
                        </button>

                    </div>
                )}

                {/* ==================================
                    STATS
                ================================== */}

                <section className="mb-6 grid gap-4 sm:grid-cols-3">

                    <StatCard
                        icon={FilesIcon}
                        label="Total Files"
                        value={files.length}
                        description="Uploaded files"
                    />

                    <StatCard
                        icon={HardDrive}
                        label="Storage Used"
                        value={formatFileSize(
                            totalStorage
                        )}
                        description="Across all groups"
                    />

                    <StatCard
                        icon={FolderKanban}
                        label="Groups"
                        value={totalGroups}
                        description="Groups with files"
                    />

                </section>

                {/* ==================================
                    FILES
                ================================== */}

                <section
                    className="
                        overflow-hidden
                        rounded-3xl
                        border
                        border-white/[0.08]
                        bg-white/[0.03]
                    "
                >

                    {/* ==============================
                        TABLE HEADER
                    ============================== */}

                    <div
                        className="
                            flex
                            flex-col
                            gap-5
                            border-b
                            border-white/[0.06]
                            p-5
                            sm:p-6
                            lg:flex-row
                            lg:items-center
                            lg:justify-between
                        "
                    >

                        <div>

                            <h2 className="font-semibold">
                                All Files
                            </h2>

                            <p className="mt-1 text-sm text-gray-600">
                                {filteredFiles.length}{" "}
                                {filteredFiles.length === 1
                                    ? "file"
                                    : "files"}

                                {search &&
                                    ` matching "${search}"`}
                            </p>

                        </div>

                        {/* SEARCH */}

                        <div className="relative w-full lg:w-80">

                            <Search
                                size={16}
                                className="
                                    absolute
                                    left-4
                                    top-1/2
                                    -translate-y-1/2
                                    text-gray-600
                                "
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search files..."
                                className="
                                    w-full
                                    rounded-xl
                                    border
                                    border-white/[0.08]
                                    bg-black/20
                                    py-3
                                    pl-11
                                    pr-10
                                    text-sm
                                    text-white
                                    outline-none
                                    transition
                                    placeholder:text-gray-700
                                    focus:border-violet-500/50
                                    focus:bg-violet-500/[0.03]
                                "
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch("")
                                    }
                                    className="
                                        absolute
                                        right-3
                                        top-1/2
                                        -translate-y-1/2
                                        rounded-lg
                                        p-1
                                        text-gray-600
                                        hover:text-white
                                    "
                                >
                                    <X size={15} />
                                </button>
                            )}

                        </div>

                    </div>

                    {/* ==================================
                        EMPTY
                    ================================== */}

                    {files.length === 0 ? (
                        <EmptyState
                            title="No files yet"
                            description="Files uploaded by group members will appear here."
                        />
                    ) : filteredFiles.length === 0 ? (
                        <EmptyState
                            title="No files found"
                            description={`Nothing matched "${search}".`}
                        />
                    ) : (
                        <>

                            {/* ==================================
                                DESKTOP TABLE
                            ================================== */}

                            <div className="hidden overflow-x-auto lg:block">

                                <table className="w-full">

                                    <thead
                                        className="
                                            border-b
                                            border-white/[0.06]
                                            bg-white/[0.015]
                                        "
                                    >
                                        <tr>

                                            <TableHeading>
                                                File
                                            </TableHeading>

                                            <TableHeading>
                                                Size
                                            </TableHeading>

                                            <TableHeading>
                                                Uploaded By
                                            </TableHeading>

                                            <TableHeading>
                                                Group
                                            </TableHeading>

                                            <TableHeading>
                                                Uploaded
                                            </TableHeading>

                                            <TableHeading align="right">
                                                Actions
                                            </TableHeading>

                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-white/[0.05]">

                                        {filteredFiles.map(
                                            (file) => {
                                                const FileIcon =
                                                    getFileIcon(
                                                        file
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            file._id
                                                        }
                                                        className="
                                                            transition
                                                            hover:bg-white/[0.025]
                                                        "
                                                    >

                                                        {/* FILE */}

                                                        <td className="px-6 py-4">

                                                            <div className="flex max-w-70 items-center gap-3">

                                                                <div
                                                                    className="
                                                                        flex
                                                                        h-10
                                                                        w-10
                                                                        shrink-0
                                                                        items-center
                                                                        justify-center
                                                                        rounded-xl
                                                                        bg-violet-500/10
                                                                        text-violet-300
                                                                    "
                                                                >
                                                                    <FileIcon
                                                                        size={
                                                                            18
                                                                        }
                                                                    />
                                                                </div>

                                                                <div className="min-w-0">

                                                                    <p
                                                                        className="
                                                                            truncate
                                                                            text-sm
                                                                            font-medium
                                                                            text-gray-200
                                                                        "
                                                                        title={
                                                                            file.originalName
                                                                        }
                                                                    >
                                                                        {file.originalName ||
                                                                            file.fileName ||
                                                                            "Unnamed file"}
                                                                    </p>

                                                                    <div className="mt-1 flex items-center gap-2">

                                                                        <span className="max-w-30 truncate text-xs text-gray-600">
                                                                            {file.fileType ||
                                                                                "Unknown"}
                                                                        </span>

                                                                        <span className="text-gray-800">
                                                                            •
                                                                        </span>

                                                                        <span className="text-xs text-gray-600">
                                                                            v
                                                                            {file.version ||
                                                                                1}
                                                                        </span>

                                                                    </div>

                                                                </div>

                                                            </div>

                                                        </td>

                                                        {/* SIZE */}

                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                            {formatFileSize(
                                                                file.fileSize
                                                            )}
                                                        </td>

                                                        {/* UPLOADER */}

                                                        <td className="px-6 py-4">

                                                            <div className="flex items-center gap-3">

                                                                <UserAvatar
                                                                    user={
                                                                        file.uploadedBy
                                                                    }
                                                                    size="sm"
                                                                />

                                                                <div className="min-w-0">

                                                                    <p className="max-w-40 truncate text-sm font-medium text-gray-300">
                                                                        {file
                                                                            .uploadedBy
                                                                            ?.name ||
                                                                            "Unknown"}
                                                                    </p>

                                                                    <p className="mt-0.5 max-w-45 truncate text-xs text-gray-600">
                                                                        {file
                                                                            .uploadedBy
                                                                            ?.email ||
                                                                            "No email"}
                                                                    </p>

                                                                </div>

                                                            </div>

                                                        </td>

                                                        {/* GROUP */}

                                                        <td className="px-6 py-4">

                                                            <span
                                                                className="
                                                                    inline-flex
                                                                    max-w-40
                                                                    items-center
                                                                    gap-1.5
                                                                    truncate
                                                                    rounded-lg
                                                                    border
                                                                    border-violet-500/10
                                                                    bg-violet-500/[0.07]
                                                                    px-2.5
                                                                    py-1.5
                                                                    text-xs
                                                                    text-violet-300
                                                                "
                                                            >
                                                                <FolderKanban
                                                                    size={
                                                                        12
                                                                    }
                                                                />

                                                                <span className="truncate">
                                                                    {file
                                                                        .group
                                                                        ?.groupName ||
                                                                        "Unknown"}
                                                                </span>

                                                            </span>

                                                        </td>

                                                        {/* DATE */}

                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                            {formatDate(
                                                                file.createdAt
                                                            )}
                                                        </td>

                                                        {/* ACTIONS */}

                                                        <td className="px-6 py-4">

                                                            <div className="flex items-center justify-end gap-2">

                                                                {file.fileUrl && (
                                                                    <a
                                                                        href={
                                                                            file.fileUrl
                                                                        }
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        title="Open file"
                                                                        className="
                                                                            flex
                                                                            h-9
                                                                            w-9
                                                                            items-center
                                                                            justify-center
                                                                            rounded-lg
                                                                            border
                                                                            border-white/[0.07]
                                                                            bg-white/[0.03]
                                                                            text-gray-500
                                                                            transition
                                                                            hover:border-violet-500/20
                                                                            hover:bg-violet-500/10
                                                                            hover:text-violet-300
                                                                        "
                                                                    >
                                                                        <ExternalLink
                                                                            size={
                                                                                15
                                                                            }
                                                                        />
                                                                    </a>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    title="Delete file"
                                                                    className="
                                                                        flex
                                                                        h-9
                                                                        w-9
                                                                        items-center
                                                                        justify-center
                                                                        rounded-lg
                                                                        border
                                                                        border-red-500/10
                                                                        bg-red-500/[0.04]
                                                                        text-red-400/60
                                                                        transition
                                                                        hover:border-red-500/20
                                                                        hover:bg-red-500/10
                                                                        hover:text-red-300
                                                                    "
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                </button>

                                                            </div>

                                                        </td>

                                                    </tr>
                                                );
                                            }
                                        )}

                                    </tbody>

                                </table>

                            </div>

                            {/* ==================================
                                MOBILE / TABLET
                            ================================== */}

                            <div className="divide-y divide-white/[0.06] lg:hidden">

                                {filteredFiles.map(
                                    (file) => {
                                        const FileIcon =
                                            getFileIcon(
                                                file
                                            );

                                        return (
                                            <div
                                                key={
                                                    file._id
                                                }
                                                className="p-5"
                                            >

                                                <div className="flex items-start gap-4">

                                                    <div
                                                        className="
                                                            flex
                                                            h-11
                                                            w-11
                                                            shrink-0
                                                            items-center
                                                            justify-center
                                                            rounded-xl
                                                            bg-violet-500/10
                                                            text-violet-300
                                                        "
                                                    >
                                                        <FileIcon
                                                            size={
                                                                19
                                                            }
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1">

                                                        <p className="truncate font-medium text-gray-200">
                                                            {file.originalName ||
                                                                file.fileName ||
                                                                "Unnamed file"}
                                                        </p>

                                                        <p className="mt-1 text-xs text-gray-600">
                                                            {formatFileSize(
                                                                file.fileSize
                                                            )}{" "}
                                                            • v
                                                            {file.version ||
                                                                1}
                                                        </p>

                                                    </div>

                                                </div>

                                                {/* DETAILS */}

                                                <div className="mt-5 grid grid-cols-2 gap-4">

                                                    <MobileDetail
                                                        label="Group"
                                                        value={
                                                            file
                                                                .group
                                                                ?.groupName ||
                                                            "Unknown"
                                                        }
                                                    />

                                                    <MobileDetail
                                                        label="Uploaded"
                                                        value={formatDate(
                                                            file.createdAt
                                                        )}
                                                    />

                                                </div>

                                                {/* USER */}

                                                <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/[0.05] pt-4">

                                                    <div className="flex min-w-0 items-center gap-3">

                                                        <UserAvatar
                                                            user={
                                                                file.uploadedBy
                                                            }
                                                            size="sm"
                                                        />

                                                        <div className="min-w-0">

                                                            <p className="truncate text-xs font-medium text-gray-300">
                                                                {file
                                                                    .uploadedBy
                                                                    ?.name ||
                                                                    "Unknown"}
                                                            </p>

                                                            <p className="mt-0.5 truncate text-[11px] text-gray-600">
                                                                {file
                                                                    .uploadedBy
                                                                    ?.email ||
                                                                    "No email"}
                                                            </p>

                                                        </div>

                                                    </div>

                                                    <div className="flex shrink-0 gap-2">

                                                        {file.fileUrl && (
                                                            <a
                                                                href={
                                                                    file.fileUrl
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="
                                                                    flex
                                                                    h-9
                                                                    w-9
                                                                    items-center
                                                                    justify-center
                                                                    rounded-lg
                                                                    bg-violet-500/10
                                                                    text-violet-300
                                                                "
                                                            >
                                                                <ExternalLink
                                                                    size={
                                                                        15
                                                                    }
                                                                />
                                                            </a>
                                                        )}

                                                        <button
                                                            type="button"
                                                            className="
                                                                flex
                                                                h-9
                                                                w-9
                                                                items-center
                                                                justify-center
                                                                rounded-lg
                                                                bg-red-500/[0.07]
                                                                text-red-400
                                                            "
                                                        >
                                                            <Trash2
                                                                size={
                                                                    15
                                                                }
                                                            />
                                                        </button>

                                                    </div>

                                                </div>

                                            </div>
                                        );
                                    }
                                )}

                            </div>

                        </>
                    )}

                </section>

                {/* ==================================
                    FOOTER
                ================================== */}

                <footer className="mt-10 border-t border-white/[0.06] py-6">

                    <div className="flex flex-col gap-2 text-xs text-gray-700 sm:flex-row sm:justify-between">

                        <p>
                            CodeGPM Administration
                        </p>

                        <p>
                            {files.length} files •{" "}
                            {formatFileSize(
                                totalStorage
                            )}{" "}
                            stored
                        </p>

                    </div>

                </footer>

            </main>

        </div>
    );
}

// ==========================================
// STAT CARD
// ==========================================

function StatCard({
    icon: Icon,
    label,
    value,
    description,
}) {
    return (
        <div
            className="
                rounded-2xl
                border
                border-white/[0.08]
                bg-white/[0.03]
                p-5
            "
        >

            <div className="flex items-center justify-between">

                <div
                    className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-violet-500/10
                        text-violet-300
                    "
                >
                    <Icon size={18} />
                </div>

            </div>

            <p className="mt-5 text-2xl font-semibold tracking-tight">
                {value}
            </p>

            <p className="mt-1 text-sm font-medium text-gray-300">
                {label}
            </p>

            <p className="mt-1 text-xs text-gray-600">
                {description}
            </p>

        </div>
    );
}

// ==========================================
// TABLE HEADING
// ==========================================

function TableHeading({
    children,
    align = "left",
}) {
    return (
        <th
            className={`
                px-6
                py-4
                text-${align}
                text-xs
                font-medium
                uppercase
                tracking-wider
                text-gray-600
            `}
        >
            {children}
        </th>
    );
}

// ==========================================
// MOBILE DETAIL
// ==========================================

function MobileDetail({ label, value }) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-700">
                {label}
            </p>

            <p className="mt-1 truncate text-xs text-gray-400">
                {value}
            </p>
        </div>
    );
}

// ==========================================
// EMPTY STATE
// ==========================================

function EmptyState({
    title,
    description,
}) {
    return (
        <div className="px-6 py-20 text-center">

            <div
                className="
                    mx-auto
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-white/[0.03]
                    text-gray-700
                "
            >
                <Upload size={24} />
            </div>

            <h3 className="mt-5 font-medium text-gray-300">
                {title}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
                {description}
            </p>

        </div>
    );
}

export default Files;
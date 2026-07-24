import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    FolderKanban,
    Files,
    HardDrive,
    MessageSquare,
    ArrowUpRight,
    RefreshCw,
    LayoutDashboard,
    Database,
    ShieldCheck,
    ChevronRight,
} from "lucide-react";

import { API_ORIGIN } from "../services/apiConfig";

function Admin() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        users: 0,
        groups: 0,
        files: 0,
        storage: 0,
    });

    const [messageStats, setMessageStats] = useState({
        total: 0,
        unread: 0,
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const STORAGE_LIMIT = 500 * 1024 * 1024;

    // ==========================================
    // FETCH DASHBOARD
    // ==========================================

    const fetchDashboard = async (refresh = false) => {
        try {
            if (refresh) {
                setRefreshing(true);
            }

            setError("");

            const token = localStorage.getItem("token");

            const headers = {
                Authorization: `Bearer ${token}`,
            };

            const [dashboardResponse, messagesResponse] =
                await Promise.all([
                    fetch(
                        `${API_ORIGIN}/api/admin/dashboard`,
                        { headers }
                    ),

                    fetch(
                        `${API_ORIGIN}/api/contact/admin`,
                        { headers }
                    ),
                ]);

            // ================================
            // DASHBOARD
            // ================================

            const dashboardData =
                await dashboardResponse.json();

            if (!dashboardResponse.ok) {
                throw new Error(
                    dashboardData.message ||
                        "Failed to load dashboard."
                );
            }

            if (dashboardData.success) {
                setStats({
                    users:
                        dashboardData.stats?.users ?? 0,

                    groups:
                        dashboardData.stats?.groups ?? 0,

                    files:
                        dashboardData.stats?.files ?? 0,

                    storage:
                        dashboardData.stats?.storage ?? 0,
                });
            }

            // ================================
            // MESSAGES
            // ================================

            if (messagesResponse.ok) {
                const messagesData =
                    await messagesResponse.json();

                setMessageStats({
                    total:
                        messagesData.count ??
                        messagesData.messages?.length ??
                        0,

                    unread:
                        messagesData.unreadCount ?? 0,
                });
            }
        } catch (error) {
            console.error(
                "Admin dashboard error:",
                error
            );

            setError(
                error.message ||
                    "Failed to load admin dashboard."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    // ==========================================
    // STORAGE
    // ==========================================

    const storagePercentage = Math.min(
        (stats.storage / STORAGE_LIMIT) * 100,
        100
    );

    const formatStorage = (bytes = 0) => {
        if (!bytes) return "0 MB";

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
    // STAT CARDS
    // ==========================================

    const statCards = [
        {
            label: "Total Users",
            value: stats.users,
            description: "Registered accounts",
            icon: Users,
            route: "/admin/users",
        },

        {
            label: "Groups",
            value: stats.groups,
            description: "Created workspaces",
            icon: FolderKanban,
            route: "/admin/groups",
        },

        {
            label: "Files",
            value: stats.files,
            description: "Uploaded resources",
            icon: Files,
            route: "/admin/files",
        },

        {
            label: "Messages",
            value: messageStats.total,
            description:
                messageStats.unread > 0
                    ? `${messageStats.unread} unread`
                    : "No unread messages",
            icon: MessageSquare,
            route: "/admin/messages",
            badge:
                messageStats.unread > 0
                    ? messageStats.unread
                    : null,
        },
    ];

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#08080d] text-white">
                <div className="text-center">
                    <RefreshCw className="mx-auto h-7 w-7 animate-spin text-violet-500" />

                    <p className="mt-4 text-sm text-gray-500">
                        Loading admin dashboard...
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
                        bg-purple-900/5
                        blur-[140px]
                    "
                />

            </div>

            <main className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">

                {/* ==================================
                    HEADER
                ================================== */}

                <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">

                    <div>
                        <div className="mb-3 flex items-center gap-2">

                            <LayoutDashboard
                                size={15}
                                className="text-violet-400"
                            />

                            <p className="text-sm font-medium text-violet-400">
                                Administration
                            </p>

                        </div>

                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Admin Dashboard
                        </h1>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
                            Monitor CodeGPM, manage users,
                            groups, files, messages and
                            platform storage.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">

                        <div
                            className="
                                hidden
                                items-center
                                gap-2
                                rounded-xl
                                border
                                border-emerald-500/15
                                bg-emerald-500/5
                                px-3
                                py-2
                                text-xs
                                text-emerald-300
                                sm:flex
                            "
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                            System Online
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                fetchDashboard(true)
                            }
                            disabled={refreshing}
                            className="
                                inline-flex
                                cursor-pointer
                                items-center
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

                    </div>

                </header>

                {/* ==================================
                    ERROR
                ================================== */}

                {error && (
                    <div
                        className="
                            mb-7
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
                        {error}
                    </div>
                )}

                {/* ==================================
                    STATS
                ================================== */}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    {statCards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <button
                                key={card.label}
                                type="button"
                                onClick={() =>
                                    navigate(card.route)
                                }
                                className="
                                    group
                                    relative
                                    overflow-hidden
                                    rounded-2xl
                                    border
                                    border-white/[0.08]
                                    bg-white/[0.03]
                                    p-5
                                    text-left
                                    transition-all
                                    duration-300
                                    hover:-translate-y-0.5
                                    hover:border-violet-500/30
                                    hover:bg-violet-500/[0.04]
                                "
                            >

                                <div className="flex items-start justify-between">

                                    <div
                                        className="
                                            flex
                                            h-11
                                            w-11
                                            items-center
                                            justify-center
                                            rounded-xl
                                            border
                                            border-violet-500/10
                                            bg-violet-500/10
                                            text-violet-300
                                        "
                                    >
                                        <Icon size={20} />
                                    </div>

                                    <div className="flex items-center gap-2">

                                        {card.badge && (
                                            <span
                                                className="
                                                    flex
                                                    min-w-5
                                                    items-center
                                                    justify-center
                                                    rounded-full
                                                    bg-violet-600
                                                    px-1.5
                                                    py-0.5
                                                    text-[10px]
                                                    font-semibold
                                                    text-white
                                                "
                                            >
                                                {card.badge}
                                            </span>
                                        )}

                                        <ArrowUpRight
                                            size={16}
                                            className="
                                                text-gray-700
                                                transition
                                                group-hover:text-violet-300
                                            "
                                        />

                                    </div>

                                </div>

                                <p className="mt-6 text-3xl font-semibold tracking-tight">
                                    {card.value}
                                </p>

                                <p className="mt-1 text-sm font-medium text-gray-300">
                                    {card.label}
                                </p>

                                <p className="mt-1 text-xs text-gray-600">
                                    {card.description}
                                </p>

                            </button>
                        );
                    })}

                </section>

                {/* ==================================
                    MAIN GRID
                ================================== */}

                <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">

                    {/* ==============================
                        QUICK ACTIONS
                    ============================== */}

                    <section
                        className="
                            overflow-hidden
                            rounded-3xl
                            border
                            border-white/[0.08]
                            bg-white/[0.03]
                        "
                    >

                        <div className="border-b border-white/[0.06] px-6 py-5">

                            <h2 className="text-lg font-semibold">
                                Quick Actions
                            </h2>

                            <p className="mt-1 text-sm text-gray-600">
                                Manage the main areas of
                                CodeGPM.
                            </p>

                        </div>

                        <div className="p-3">

                            {/* USERS */}

                            <AdminAction
                                icon={Users}
                                title="Manage Users"
                                description="View and manage registered accounts."
                                onClick={() =>
                                    navigate("/admin/users")
                                }
                            />

                            {/* GROUPS */}

                            <AdminAction
                                icon={FolderKanban}
                                title="Manage Groups"
                                description="Inspect and manage project groups."
                                onClick={() =>
                                    navigate("/admin/groups")
                                }
                            />

                            {/* FILES */}

                            <AdminAction
                                icon={Files}
                                title="View Files"
                                description="Manage files uploaded to CodeGPM."
                                onClick={() =>
                                    navigate("/admin/files")
                                }
                            />

                            {/* MESSAGES */}

                            <AdminAction
                                icon={MessageSquare}
                                title="Messages"
                                description={
                                    messageStats.unread > 0
                                        ? `${messageStats.unread} new message${
                                              messageStats.unread ===
                                              1
                                                  ? ""
                                                  : "s"
                                          } waiting for you.`
                                        : "View contact messages and feedback."
                                }
                                badge={messageStats.unread}
                                onClick={() =>
                                    navigate(
                                        "/admin/messages"
                                    )
                                }
                            />

                            {/* STORAGE */}

                            <AdminAction
                                icon={HardDrive}
                                title="Storage"
                                description="Monitor platform storage usage."
                                onClick={() =>
                                    navigate(
                                        "/admin/storage"
                                    )
                                }
                            />

                        </div>

                    </section>

                    {/* ==============================
                        SYSTEM INFORMATION
                    ============================== */}

                    <section
                        className="
                            rounded-3xl
                            border
                            border-white/[0.08]
                            bg-white/[0.03]
                            p-6
                        "
                    >

                        <div className="flex items-center gap-3">

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
                                <ShieldCheck size={19} />
                            </div>

                            <div>
                                <h2 className="font-semibold">
                                    System
                                </h2>

                                <p className="text-xs text-gray-600">
                                    Platform overview
                                </p>
                            </div>

                        </div>

                        <div className="mt-6 space-y-3">

                            <SystemRow
                                label="Database"
                                value="Connected"
                                icon={Database}
                            />

                            <SystemRow
                                label="Authentication"
                                value="Active"
                                icon={ShieldCheck}
                            />

                            <SystemRow
                                label="Storage Limit"
                                value="500 MB"
                                icon={HardDrive}
                            />

                        </div>

                    </section>

                </div>

                {/* ==================================
                    STORAGE
                ================================== */}

                <section
                    className="
                        mt-6
                        overflow-hidden
                        rounded-3xl
                        border
                        border-white/[0.08]
                        bg-white/[0.03]
                    "
                >

                    {/* HEADER */}

                    <div
                        className="
                            flex
                            flex-col
                            gap-4
                            border-b
                            border-white/[0.06]
                            px-6
                            py-5
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                        "
                    >

                        <div className="flex items-center gap-4">

                            <div
                                className="
                                    flex
                                    h-11
                                    w-11
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-violet-500/10
                                    text-violet-300
                                "
                            >
                                <HardDrive size={20} />
                            </div>

                            <div>
                                <h2 className="font-semibold">
                                    Storage Usage
                                </h2>

                                <p className="mt-0.5 text-sm text-gray-600">
                                    Current CodeGPM file
                                    storage.
                                </p>
                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/admin/storage")
                            }
                            className="
                                inline-flex
                                items-center
                                gap-1
                                text-sm
                                text-violet-400
                                transition
                                hover:text-violet-300
                            "
                        >
                            View details

                            <ChevronRight size={16} />
                        </button>

                    </div>

                    {/* STORAGE BODY */}

                    <div className="p-6">

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

                            <div>

                                <p className="text-3xl font-semibold tracking-tight">
                                    {formatStorage(
                                        stats.storage
                                    )}
                                </p>

                                <p className="mt-1 text-sm text-gray-600">
                                    of 500 MB used
                                </p>

                            </div>

                            <p className="text-sm font-medium text-gray-400">
                                {storagePercentage.toFixed(
                                    1
                                )}
                                %
                            </p>

                        </div>

                        {/* BAR */}

                        <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">

                            <div
                                className="
                                    h-full
                                    rounded-full
                                    bg-violet-500
                                    transition-all
                                    duration-700
                                "
                                style={{
                                    width: `${storagePercentage}%`,
                                }}
                            />

                        </div>

                        {/* DETAILS */}

                        <div className="mt-3 flex flex-col gap-1 text-xs text-gray-600 sm:flex-row sm:justify-between">

                            <span>
                                {formatStorage(
                                    stats.storage
                                )}{" "}
                                used
                            </span>

                            <span>
                                {formatStorage(
                                    Math.max(
                                        STORAGE_LIMIT -
                                            stats.storage,
                                        0
                                    )
                                )}{" "}
                                available
                            </span>

                        </div>

                    </div>

                </section>

                {/* ==================================
                    FOOTER
                ================================== */}

                <footer className="mt-10 border-t border-white/[0.06] py-6">

                    <div className="flex flex-col gap-2 text-xs text-gray-700 sm:flex-row sm:items-center sm:justify-between">

                        <p>
                            CodeGPM Administration
                        </p>

                        <p>
                            Restricted access
                        </p>

                    </div>

                </footer>

            </main>
        </div>
    );
}

// ==========================================
// ADMIN ACTION
// ==========================================

function AdminAction({
    icon: Icon,
    title,
    description,
    badge,
    onClick,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="
                group
                flex
                w-full
                items-center
                gap-4
                rounded-2xl
                p-4
                text-left
                transition
                hover:bg-white/[0.04]
            "
        >

            <div
                className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-white/[0.04]
                    text-gray-400
                    transition
                    group-hover:bg-violet-500/10
                    group-hover:text-violet-300
                "
            >
                <Icon size={19} />
            </div>

            <div className="min-w-0 flex-1">

                <div className="flex items-center gap-2">

                    <p className="text-sm font-medium text-gray-200">
                        {title}
                    </p>

                    {badge > 0 && (
                        <span
                            className="
                                rounded-full
                                bg-violet-600
                                px-2
                                py-0.5
                                text-[10px]
                                font-semibold
                                text-white
                            "
                        >
                            {badge}
                        </span>
                    )}

                </div>

                <p className="mt-1 truncate text-xs text-gray-600">
                    {description}
                </p>

            </div>

            <ChevronRight
                size={17}
                className="
                    shrink-0
                    text-gray-700
                    transition
                    group-hover:translate-x-0.5
                    group-hover:text-violet-400
                "
            />

        </button>
    );
}

// ==========================================
// SYSTEM ROW
// ==========================================

function SystemRow({
    icon: Icon,
    label,
    value,
}) {
    return (
        <div
            className="
                flex
                items-center
                justify-between
                rounded-xl
                border
                border-white/[0.05]
                bg-black/10
                px-4
                py-3
            "
        >

            <div className="flex items-center gap-3">

                <Icon
                    size={15}
                    className="text-gray-600"
                />

                <span className="text-sm text-gray-400">
                    {label}
                </span>

            </div>

            <div className="flex items-center gap-2">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                <span className="text-xs text-gray-400">
                    {value}
                </span>

            </div>

        </div>
    );
}

export default Admin;
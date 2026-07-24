import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertTriangle,
    Database,
    FileText,
    HardDrive,
    RefreshCw,
    Search,
    Users,
    X,
} from "lucide-react";

import UserAvatar from "../Components/UserAvatar";
import { API_ORIGIN } from "../services/apiConfig";

function Storage() {
    const [stats, setStats] = useState({
        storage: 0,
    });

    const [userStorage, setUserStorage] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    // 500 MB application storage
    const STORAGE_LIMIT = 500 * 1024 * 1024;

    // 20 MB per user
    const USER_STORAGE_LIMIT = 20 * 1024 * 1024;

    // ==========================================
    // FETCH STORAGE
    // ==========================================

    const fetchStorage = useCallback(
        async (refresh = false) => {
            try {
                if (refresh) {
                    setRefreshing(true);
                }

                setError("");

                const token =
                    localStorage.getItem("token");

                const response = await fetch(
                    `${API_ORIGIN}/api/admin/dashboard`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Failed to load storage data."
                    );
                }

                if (data.success) {
                    setStats({
                        storage:
                            data.stats?.storage ?? 0,
                    });

                    setUserStorage(
                        data.userStorage || []
                    );
                }
            } catch (error) {
                console.error(
                    "Error fetching storage:",
                    error
                );

                setError(
                    error.message ||
                        "Failed to load storage information."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        fetchStorage();
    }, [fetchStorage]);

    // ==========================================
    // FORMAT STORAGE
    // ==========================================

    const formatStorage = (bytes = 0) => {
        if (!bytes) return "0 MB";

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(
                bytes / 1024
            ).toFixed(2)} KB`;
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
    // TOTAL STORAGE
    // ==========================================

    const storagePercentage = Math.min(
        (stats.storage / STORAGE_LIMIT) * 100,
        100
    );

    const remainingStorage = Math.max(
        STORAGE_LIMIT - stats.storage,
        0
    );

    // ==========================================
    // USER STATS
    // ==========================================

    const totalFiles = useMemo(() => {
        return userStorage.reduce(
            (total, user) =>
                total + (user.fileCount || 0),
            0
        );
    }, [userStorage]);

    const averageStorage = useMemo(() => {
        if (!userStorage.length) return 0;

        return (
            userStorage.reduce(
                (total, user) =>
                    total +
                    (user.storageUsed || 0),
                0
            ) / userStorage.length
        );
    }, [userStorage]);

    // ==========================================
    // SEARCH
    // ==========================================

    const filteredUsers = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();

        if (!query) {
            return userStorage;
        }

        return userStorage.filter(
            (user) =>
                user.name
                    ?.toLowerCase()
                    .includes(query) ||
                user.email
                    ?.toLowerCase()
                    .includes(query)
        );
    }, [userStorage, search]);

    // ==========================================
    // STORAGE STATUS
    // ==========================================

    const getStorageStatus = (
        percentage
    ) => {
        if (percentage >= 90) {
            return {
                label: "Critical",
                textClass: "text-red-400",
                bgClass: "bg-red-500",
            };
        }

        if (percentage >= 70) {
            return {
                label: "High",
                textClass: "text-amber-400",
                bgClass: "bg-amber-500",
            };
        }

        return {
            label: "Healthy",
            textClass: "text-emerald-400",
            bgClass: "bg-violet-500",
        };
    };

    const storageStatus =
        getStorageStatus(storagePercentage);

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#08080d] text-white">

                <div className="text-center">

                    <RefreshCw className="mx-auto h-7 w-7 animate-spin text-violet-500" />

                    <p className="mt-4 text-sm text-gray-500">
                        Loading storage data...
                    </p>

                </div>

            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#08080d] text-white">

            {/* BACKGROUND */}

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

                            <HardDrive
                                size={15}
                                className="text-violet-400"
                            />

                            <p className="text-sm font-medium text-violet-400">
                                Administration
                            </p>

                        </div>

                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Storage Management
                        </h1>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
                            Monitor CodeGPM storage,
                            uploaded files and individual
                            user usage.
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            fetchStorage(true)
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

                {/* ERROR */}

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
                            type="button"
                            onClick={() =>
                                setError("")
                            }
                            className="opacity-60 hover:opacity-100"
                        >
                            <X size={16} />
                        </button>

                    </div>
                )}

                {/* ==================================
                    MAIN STORAGE
                ================================== */}

                <section
                    className="
                        relative
                        mb-6
                        overflow-hidden
                        rounded-3xl
                        border
                        border-white/[0.08]
                        bg-white/[0.03]
                        p-6
                        sm:p-7
                    "
                >

                    <div
                        className="
                            pointer-events-none
                            absolute
                            right-0
                            top-0
                            h-60
                            w-60
                            rounded-full
                            bg-violet-600/10
                            blur-[100px]
                        "
                    />

                    <div className="relative">

                        {/* TOP */}

                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                            <div className="flex items-center gap-4">

                                <div
                                    className="
                                        flex
                                        h-12
                                        w-12
                                        items-center
                                        justify-center
                                        rounded-2xl
                                        border
                                        border-violet-500/10
                                        bg-violet-500/10
                                        text-violet-300
                                    "
                                >
                                    <Database size={21} />
                                </div>

                                <div>

                                    <h2 className="font-semibold">
                                        Application Storage
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-600">
                                        Total file storage
                                        across CodeGPM
                                    </p>

                                </div>

                            </div>

                            <div
                                className={`
                                    inline-flex
                                    w-fit
                                    items-center
                                    gap-2
                                    rounded-full
                                    border
                                    border-white/[0.07]
                                    bg-white/[0.03]
                                    px-3
                                    py-1.5
                                    text-xs
                                    ${storageStatus.textClass}
                                `}
                            >
                                <span
                                    className={`
                                        h-1.5
                                        w-1.5
                                        rounded-full
                                        ${storageStatus.bgClass}
                                    `}
                                />

                                {storageStatus.label}
                            </div>

                        </div>

                        {/* STORAGE NUMBER */}

                        <div className="mt-10">

                            <div className="flex flex-wrap items-end gap-2">

                                <p className="text-4xl font-semibold tracking-tight sm:text-5xl">
                                    {formatStorage(
                                        stats.storage
                                    )}
                                </p>

                                <span className="mb-1 text-sm text-gray-600">
                                    / 500 MB
                                </span>

                            </div>

                            <p className="mt-2 text-sm text-gray-600">
                                {storagePercentage.toFixed(
                                    2
                                )}
                                % of total capacity used
                            </p>

                        </div>

                        {/* PROGRESS */}

                        <div className="mt-7">

                            <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.06]">

                                <div
                                    className={`
                                        h-full
                                        rounded-full
                                        transition-all
                                        duration-700
                                        ${storageStatus.bgClass}
                                    `}
                                    style={{
                                        width: `${storagePercentage}%`,
                                    }}
                                />

                            </div>

                            <div className="mt-3 flex flex-col gap-1 text-xs text-gray-600 sm:flex-row sm:justify-between">

                                <span>
                                    {formatStorage(
                                        stats.storage
                                    )}{" "}
                                    used
                                </span>

                                <span>
                                    {formatStorage(
                                        remainingStorage
                                    )}{" "}
                                    available
                                </span>

                            </div>

                        </div>

                    </div>

                </section>

                {/* ==================================
                    STATS
                ================================== */}

                <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <StatCard
                        icon={HardDrive}
                        label="Storage Used"
                        value={formatStorage(
                            stats.storage
                        )}
                        description={`${storagePercentage.toFixed(
                            1
                        )}% of capacity`}
                    />

                    <StatCard
                        icon={Database}
                        label="Available"
                        value={formatStorage(
                            remainingStorage
                        )}
                        description="Remaining capacity"
                    />

                    <StatCard
                        icon={Users}
                        label="Active Users"
                        value={userStorage.length}
                        description="Users consuming storage"
                    />

                    <StatCard
                        icon={FileText}
                        label="Files"
                        value={totalFiles}
                        description={`Avg. ${formatStorage(
                            averageStorage
                        )} per user`}
                    />

                </section>

                {/* ==================================
                    USER STORAGE
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

                    {/* HEADER */}

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
                                Storage by User
                            </h2>

                            <p className="mt-1 text-sm text-gray-600">
                                Storage consumed by files
                                uploaded by each user.
                            </p>

                        </div>

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
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search users..."
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

                    {/* EMPTY */}

                    {userStorage.length === 0 ? (
                        <EmptyStorage />
                    ) : filteredUsers.length ===
                      0 ? (
                        <div className="px-6 py-16 text-center">

                            <Search
                                size={26}
                                className="mx-auto text-gray-700"
                            />

                            <p className="mt-4 font-medium text-gray-300">
                                No users found
                            </p>

                            <p className="mt-2 text-sm text-gray-600">
                                Nothing matched "{search}".
                            </p>

                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.06]">

                            {filteredUsers.map(
                                (user) => {
                                    const percentage =
                                        Math.min(
                                            ((user.storageUsed ||
                                                0) /
                                                USER_STORAGE_LIMIT) *
                                                100,
                                            100
                                        );

                                    const status =
                                        getStorageStatus(
                                            percentage
                                        );

                                    return (
                                        <div
                                            key={
                                                user.userId
                                            }
                                            className="
                                                p-5
                                                transition
                                                hover:bg-white/[0.02]
                                                sm:p-6
                                            "
                                        >

                                            {/* USER */}

                                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                                                <div className="flex min-w-0 items-center gap-3">

                                                    <UserAvatar
                                                        user={
                                                            user
                                                        }
                                                        size="sm"
                                                    />

                                                    <div className="min-w-0">

                                                        <div className="flex items-center gap-2">

                                                            <p className="truncate text-sm font-medium text-gray-200">
                                                                {user.name ||
                                                                    "Unknown User"}
                                                            </p>

                                                            {percentage >=
                                                                90 && (
                                                                <AlertTriangle
                                                                    size={
                                                                        13
                                                                    }
                                                                    className="shrink-0 text-red-400"
                                                                />
                                                            )}

                                                        </div>

                                                        <p className="mt-1 truncate text-xs text-gray-600">
                                                            {user.email ||
                                                                "No email"}
                                                        </p>

                                                    </div>

                                                </div>

                                                {/* USAGE */}

                                                <div className="sm:text-right">

                                                    <p className="text-sm font-semibold text-gray-200">
                                                        {formatStorage(
                                                            user.storageUsed
                                                        )}
                                                    </p>

                                                    <p className="mt-1 text-xs text-gray-600">
                                                        {user.fileCount ||
                                                            0}{" "}
                                                        {(user.fileCount ||
                                                            0) ===
                                                        1
                                                            ? "file"
                                                            : "files"}
                                                    </p>

                                                </div>

                                            </div>

                                            {/* BAR */}

                                            <div className="mt-5">

                                                <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">

                                                    <div
                                                        className={`
                                                            h-full
                                                            rounded-full
                                                            transition-all
                                                            duration-700
                                                            ${status.bgClass}
                                                        `}
                                                        style={{
                                                            width: `${percentage}%`,
                                                        }}
                                                    />

                                                </div>

                                                <div className="mt-2 flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">

                                                    <span
                                                        className={
                                                            percentage >=
                                                            90
                                                                ? "text-red-400"
                                                                : "text-gray-600"
                                                        }
                                                    >
                                                        {percentage.toFixed(
                                                            1
                                                        )}
                                                        % of
                                                        user
                                                        limit
                                                    </span>

                                                    <span className="text-gray-600">
                                                        {formatStorage(
                                                            user.storageUsed
                                                        )}{" "}
                                                        / 20 MB
                                                    </span>

                                                </div>

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>
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
                            {formatStorage(
                                stats.storage
                            )}{" "}
                            of 500 MB used
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
// EMPTY STORAGE
// ==========================================

function EmptyStorage() {
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
                <HardDrive size={24} />
            </div>

            <h3 className="mt-5 font-medium text-gray-300">
                No storage usage
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
                User storage information will
                appear here after files are uploaded.
            </p>

        </div>
    );
}

export default Storage;
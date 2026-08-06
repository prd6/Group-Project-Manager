import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    CalendarDays,
    Copy,
    FolderKanban,
    KeyRound,
    RefreshCw,
    Search,
    Trash2,
    UserRound,
    Users,
    X,
} from "lucide-react";

import AdminAPI from "../services/admin";
import UserAvatar from "../Components/UserAvatar";

function Groups() {
    const [groups, setGroups] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState("");

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [deletingId, setDeletingId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // ==========================================
    // FETCH GROUPS
    // ==========================================

    const fetchGroups = useCallback(
        async (refresh = false) => {
            try {
                if (refresh) {
                    setRefreshing(true);
                }

                setError("");

                const token =
                    localStorage.getItem("token");

                const res = await AdminAPI.get(
                    "/groups",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setGroups(res.data.groups || []);
            } catch (error) {
                console.error(
                    "Error fetching groups:",
                    error
                );

                setError(
                    error.response?.data?.message ||
                        "Failed to load groups."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    // ==========================================
    // OWNER
    // ==========================================

    const getOwner = (group) => {
        return group.members?.find(
            (member) =>
                member.role?.toLowerCase() === "owner"
        )?.user;
    };

    // ==========================================
    // FILTER
    // ==========================================

    const filteredGroups = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();

        if (!query) {
            return groups;
        }

        return groups.filter((group) => {
            const owner = getOwner(group);

            return (
                group.groupName
                    ?.toLowerCase()
                    .includes(query) ||
                group.joinCode
                    ?.toLowerCase()
                    .includes(query) ||
                owner?.name
                    ?.toLowerCase()
                    .includes(query) ||
                owner?.email
                    ?.toLowerCase()
                    .includes(query)
            );
        });
    }, [groups, search]);

    // ==========================================
    // TOTAL MEMBERS
    // ==========================================

    const totalMembers = useMemo(() => {
        return groups.reduce(
            (total, group) =>
                total +
                (group.members?.length || 0),
            0
        );
    }, [groups]);

    // ==========================================
    // DATE
    // ==========================================

    const formatDate = (date) => {
        if (!date) return "Unknown";

        return new Date(
            date
        ).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // ==========================================
    // COPY JOIN CODE
    // ==========================================

    const copyJoinCode = async (code) => {
        if (!code) return;

        try {
            await navigator.clipboard.writeText(
                code
            );

            setMessage(
                `Group key "${code}" copied.`
            );

            setError("");

            setTimeout(() => {
                setMessage("");
            }, 2500);
        } catch {
            setError(
                "Failed to copy group key."
            );
        }
    };

    // ==========================================
    // DELETE
    // ==========================================

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setDeletingId(
                deleteTarget._id
            );

            setError("");

            const token =
                localStorage.getItem("token");

            await AdminAPI.delete(
                `/groups/${deleteTarget._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setGroups((current) =>
                current.filter(
                    (group) =>
                        group._id !==
                        deleteTarget._id
                )
            );

            setMessage(
                `"${deleteTarget.groupName}" was deleted.`
            );

            setDeleteTarget(null);

            setTimeout(() => {
                setMessage("");
            }, 3000);
        } catch (error) {
            console.error(
                "Delete group error:",
                error
            );

            setError(
                error.response?.data?.message ||
                    "Failed to delete group."
            );
        } finally {
            setDeletingId(null);
        }
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#08080d] text-white">

                <div className="text-center">

                    <RefreshCw className="mx-auto h-7 w-7 animate-spin text-gray-500" />

                    <p className="mt-4 text-sm text-gray-500">
                        Loading groups...
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
                        bg-gray-700/8
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
                        bg-gray-800/5
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

                            <FolderKanban
                                size={15}
                                className="text-gray-400"
                            />

                            <p className="text-sm font-medium text-gray-400">
                                Administration
                            </p>

                        </div>

                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Group Management
                        </h1>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
                            View and manage project groups,
                            owners and members across
                            CodeGPM.
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            fetchGroups(true)
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
                    FEEDBACK
                ================================== */}

                {error && (
                    <Feedback
                        type="error"
                        message={error}
                        close={() =>
                            setError("")
                        }
                    />
                )}

                {message && (
                    <Feedback
                        type="success"
                        message={message}
                        close={() =>
                            setMessage("")
                        }
                    />
                )}

                {/* ==================================
                    STATS
                ================================== */}

                <section className="mb-6 grid gap-4 sm:grid-cols-3">

                    <StatCard
                        icon={FolderKanban}
                        value={groups.length}
                        label="Total Groups"
                        description="Project workspaces"
                    />

                    <StatCard
                        icon={Users}
                        value={totalMembers}
                        label="Total Memberships"
                        description="Members across groups"
                    />

                    <StatCard
                        icon={UserRound}
                        value={
                            groups.filter(
                                (group) =>
                                    getOwner(group)
                            ).length
                        }
                        label="Groups With Owner"
                        description="Assigned group owners"
                    />

                </section>

                {/* ==================================
                    GROUP LIST
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
                                All Groups
                            </h2>

                            <p className="mt-1 text-sm text-gray-600">
                                {filteredGroups.length}{" "}
                                {filteredGroups.length === 1
                                    ? "group"
                                    : "groups"}

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
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search groups..."
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
                                    focus:border-gray-500/50
                                    focus:bg-[#1b1b1b]
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
                                        transition
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

                    {groups.length === 0 ? (
                        <EmptyState
                            title="No groups yet"
                            description="Groups created by users will appear here."
                        />
                    ) : filteredGroups.length ===
                      0 ? (
                        <EmptyState
                            title="No groups found"
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
                                                Group
                                            </TableHeading>

                                            <TableHeading>
                                                Group Key
                                            </TableHeading>

                                            <TableHeading>
                                                Owner
                                            </TableHeading>

                                            <TableHeading>
                                                Members
                                            </TableHeading>

                                            <TableHeading>
                                                Created
                                            </TableHeading>

                                            <TableHeading right>
                                                Actions
                                            </TableHeading>

                                        </tr>

                                    </thead>

                                    <tbody className="divide-y divide-white/[0.05]">

                                        {filteredGroups.map(
                                            (group) => {
                                                const owner =
                                                    getOwner(
                                                        group
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            group._id
                                                        }
                                                        className="
                                                            transition
                                                            hover:bg-white/[0.025]
                                                        "
                                                    >

                                                        {/* GROUP */}

                                                        <td className="px-6 py-4">

                                                            <div className="flex items-center gap-3">

                                                                <div
                                                                    className="
                                                                        flex
                                                                        h-10
                                                                        w-10
                                                                        shrink-0
                                                                        items-center
                                                                        justify-center
                                                                        rounded-xl
                                                                        bg-gray-500/10
                                                                        text-gray-300
                                                                    "
                                                                >
                                                                    <FolderKanban
                                                                        size={
                                                                            18
                                                                        }
                                                                    />
                                                                </div>

                                                                <div className="min-w-0">

                                                                    <p className="max-w-52 truncate text-sm font-medium text-gray-200">
                                                                        {group.groupName ||
                                                                            "Unnamed Group"}
                                                                    </p>

                                                                    <p className="mt-1 max-w-52 truncate text-xs text-gray-700">
                                                                        ID:{" "}
                                                                        {
                                                                            group._id
                                                                        }
                                                                    </p>

                                                                </div>

                                                            </div>

                                                        </td>

                                                        {/* JOIN CODE */}

                                                        <td className="px-6 py-4">

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    copyJoinCode(
                                                                        group.joinCode
                                                                    )
                                                                }
                                                                className="
                                                                    group/key
                                                                    inline-flex
                                                                    items-center
                                                                    gap-2
                                                                    rounded-lg
                                                                    border
                                                                    border-white/[0.07]
                                                                    bg-white/[0.03]
                                                                    px-3
                                                                    py-2
                                                                    font-mono
                                                                    text-xs
                                                                    text-gray-400
                                                                    transition
                                                                    hover:border-gray-500/20
                                                                    hover:text-gray-300
                                                                "
                                                            >
                                                                <KeyRound
                                                                    size={
                                                                        13
                                                                    }
                                                                />

                                                                {group.joinCode ||
                                                                    "N/A"}

                                                                <Copy
                                                                    size={
                                                                        12
                                                                    }
                                                                    className="
                                                                        text-gray-700
                                                                        transition
                                                                        group-hover/key:text-gray-400
                                                                    "
                                                                />

                                                            </button>

                                                        </td>

                                                        {/* OWNER */}

                                                        <td className="px-6 py-4">

                                                            <div className="flex items-center gap-3">

                                                                <UserAvatar
                                                                    user={
                                                                        owner
                                                                    }
                                                                    size="sm"
                                                                />

                                                                <div className="min-w-0">

                                                                    <p className="max-w-40 truncate text-sm font-medium text-gray-300">
                                                                        {owner?.name ||
                                                                            "Unknown"}
                                                                    </p>

                                                                    <p className="mt-0.5 max-w-45 truncate text-xs text-gray-600">
                                                                        {owner?.email ||
                                                                            "No email"}
                                                                    </p>

                                                                </div>

                                                            </div>

                                                        </td>

                                                        {/* MEMBERS */}

                                                        <td className="px-6 py-4">

                                                            <div className="inline-flex items-center gap-2 text-sm text-gray-400">

                                                                <Users
                                                                    size={
                                                                        15
                                                                    }
                                                                    className="text-gray-600"
                                                                />

                                                                {group
                                                                    .members
                                                                    ?.length ||
                                                                    0}

                                                            </div>

                                                        </td>

                                                        {/* CREATED */}

                                                        <td className="whitespace-nowrap px-6 py-4">

                                                            <div className="flex items-center gap-2 text-sm text-gray-600">

                                                                <CalendarDays
                                                                    size={
                                                                        14
                                                                    }
                                                                />

                                                                {formatDate(
                                                                    group.createdAt
                                                                )}

                                                            </div>

                                                        </td>

                                                        {/* ACTION */}

                                                        <td className="px-6 py-4">

                                                            <div className="flex justify-end">

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setDeleteTarget(
                                                                            group
                                                                        )
                                                                    }
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
                                                                        text-red-400/70
                                                                        transition
                                                                        hover:border-red-500/20
                                                                        hover:bg-red-500/10
                                                                        hover:text-red-300
                                                                    "
                                                                    title="Delete group"
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
                                MOBILE
                            ================================== */}

                            <div className="divide-y divide-white/[0.06] lg:hidden">

                                {filteredGroups.map(
                                    (group) => {
                                        const owner =
                                            getOwner(
                                                group
                                            );

                                        return (
                                            <div
                                                key={
                                                    group._id
                                                }
                                                className="p-5"
                                            >

                                                {/* TOP */}

                                                <div className="flex items-start justify-between gap-4">

                                                    <div className="flex min-w-0 items-center gap-3">

                                                        <div
                                                            className="
                                                                flex
                                                                h-11
                                                                w-11
                                                                shrink-0
                                                                items-center
                                                                justify-center
                                                                rounded-xl
                                                                bg-gray-500/10
                                                                text-gray-300
                                                            "
                                                        >
                                                            <FolderKanban
                                                                size={
                                                                    19
                                                                }
                                                            />
                                                        </div>

                                                        <div className="min-w-0">

                                                            <p className="truncate font-medium text-gray-200">
                                                                {group.groupName ||
                                                                    "Unnamed Group"}
                                                            </p>

                                                            <p className="mt-1 text-xs text-gray-600">
                                                                {group
                                                                    .members
                                                                    ?.length ||
                                                                    0}{" "}
                                                                members
                                                            </p>

                                                        </div>

                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDeleteTarget(
                                                                group
                                                            )
                                                        }
                                                        className="
                                                            flex
                                                            h-9
                                                            w-9
                                                            shrink-0
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

                                                {/* DETAILS */}

                                                <div className="mt-5 grid grid-cols-2 gap-4">

                                                    <MobileDetail
                                                        label="Group Key"
                                                        value={
                                                            group.joinCode ||
                                                            "N/A"
                                                        }
                                                    />

                                                    <MobileDetail
                                                        label="Created"
                                                        value={formatDate(
                                                            group.createdAt
                                                        )}
                                                    />

                                                </div>

                                                {/* OWNER */}

                                                <div className="mt-5 border-t border-white/[0.05] pt-4">

                                                    <p className="mb-3 text-[10px] uppercase tracking-wider text-gray-700">
                                                        Owner
                                                    </p>

                                                    <div className="flex items-center gap-3">

                                                        <UserAvatar
                                                            user={
                                                                owner
                                                            }
                                                            size="sm"
                                                        />

                                                        <div className="min-w-0">

                                                            <p className="truncate text-sm font-medium text-gray-300">
                                                                {owner?.name ||
                                                                    "Unknown"}
                                                            </p>

                                                            <p className="mt-0.5 truncate text-xs text-gray-600">
                                                                {owner?.email ||
                                                                    "No email"}
                                                            </p>

                                                        </div>

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

                {/* FOOTER */}

                <footer className="mt-10 border-t border-white/[0.06] py-6">

                    <div className="flex flex-col gap-2 text-xs text-gray-700 sm:flex-row sm:justify-between">

                        <p>
                            CodeGPM Administration
                        </p>

                        <p>
                            {groups.length} groups •{" "}
                            {totalMembers} memberships
                        </p>

                    </div>

                </footer>

            </main>

            {/* ==================================
                DELETE CONFIRMATION
            ================================== */}

            {deleteTarget && (
                <div
                    className="
                        fixed
                        inset-0
                        z-100
                        flex
                        items-center
                        justify-center
                        bg-black/75
                        px-4
                        
                    "
                    onClick={() => {
                        if (!deletingId) {
                            setDeleteTarget(null);
                        }
                    }}
                >

                    <div
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                        className="
                            w-full
                            max-w-md
                            rounded-3xl
                            border
                            border-white/[0.1]
                            bg-[#111118]
                            p-6
                            shadow-2xl
                        "
                    >

                        <div
                            className="
                                flex
                                h-12
                                w-12
                                items-center
                                justify-center
                                rounded-2xl
                                bg-red-500/10
                                text-red-400
                            "
                        >
                            <Trash2 size={21} />
                        </div>

                        <h3 className="mt-5 text-xl font-semibold">
                            Delete group?
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            You're about to permanently
                            delete{" "}
                            <span className="font-medium text-gray-300">
                                {deleteTarget.groupName}
                            </span>
                            . This action cannot be undone.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">

                            <button
                                type="button"
                                disabled={
                                    Boolean(deletingId)
                                }
                                onClick={() =>
                                    setDeleteTarget(
                                        null
                                    )
                                }
                                className="
                                    rounded-xl
                                    border
                                    border-white/[0.08]
                                    bg-white/[0.04]
                                    px-5
                                    py-2.5
                                    text-sm
                                    text-gray-300
                                    transition
                                    hover:bg-white/[0.08]
                                    disabled:opacity-50
                                "
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleDelete
                                }
                                disabled={
                                    Boolean(deletingId)
                                }
                                className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    rounded-xl
                                    bg-red-600
                                    px-5
                                    py-2.5
                                    text-sm
                                    font-medium
                                    text-white
                                    transition
                                    hover:bg-red-500
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >

                                {deletingId ? (
                                    <RefreshCw
                                        size={15}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Trash2
                                        size={15}
                                    />
                                )}

                                {deletingId
                                    ? "Deleting..."
                                    : "Delete Group"}

                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

// ==========================================
// STAT CARD
// ==========================================

function StatCard({
    icon: Icon,
    value,
    label,
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
                    bg-gray-500/10
                    text-gray-300
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
// TABLE HEADING
// ==========================================

function TableHeading({
    children,
    right = false,
}) {
    return (
        <th
            className={`
                px-6
                py-4
                text-xs
                font-medium
                uppercase
                tracking-wider
                text-gray-600

                ${
                    right
                        ? "text-right"
                        : "text-left"
                }
            `}
        >
            {children}
        </th>
    );
}

// ==========================================
// MOBILE DETAIL
// ==========================================

function MobileDetail({
    label,
    value,
}) {
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
                <FolderKanban size={24} />
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

// ==========================================
// FEEDBACK
// ==========================================

function Feedback({
    type,
    message,
    close,
}) {
    const error = type === "error";

    return (
        <div
            className={`
                mb-6
                flex
                items-center
                justify-between
                gap-4
                rounded-2xl
                border
                px-5
                py-4
                text-sm

                ${
                    error
                        ? "border-red-500/20 bg-red-500/10 text-red-200"
                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                }
            `}
        >

            <span>{message}</span>

            <button
                type="button"
                onClick={close}
                className="opacity-60 transition hover:opacity-100"
            >
                <X size={16} />
            </button>

        </div>
    );
}

export default Groups;
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Ban,
    CheckCircle2,
    Crown,
    Mail,
    Pencil,
    RefreshCw,
    Save,
    Search,
    ShieldCheck,
    Trash2,
    UserRound,
    Users as UsersIcon,
    X,
} from "lucide-react";

import AdminAPI from "../services/admin";
import UserAvatar from "../Components/UserAvatar";

function Users() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] =
        useState(null);
    const [deleteTarget, setDeleteTarget] =
        useState(null);

    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        role: "",
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] =
        useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] =
        useState(null);
    const [banningId, setBanningId] =
        useState(null);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] =
        useState("all");

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // ==========================================
    // AUTH HEADERS
    // ==========================================

    const getHeaders = () => {
        const token =
            localStorage.getItem("token");

        return {
            Authorization: `Bearer ${token}`,
        };
    };

    // ==========================================
    // FETCH USERS
    // ==========================================

    const fetchUsers = useCallback(
        async (refresh = false) => {
            try {
                if (refresh) {
                    setRefreshing(true);
                }

                setError("");

                const res = await AdminAPI.get(
                    "/users",
                    {
                        headers: getHeaders(),
                    }
                );

                setUsers(res.data.users || []);
            } catch (err) {
                console.error(
                    "Fetch users error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                        "Failed to load users."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // ==========================================
    // EDIT USER
    // ==========================================

    const handleEdit = (user) => {
        setSelectedUser(user);

        setEditForm({
            name: user.name || "",
            email: user.email || "",
            role: user.role || "user",
        });

        setError("");
    };

    // ==========================================
    // SAVE USER
    // ==========================================

    const saveUser = async () => {
        if (!selectedUser) return;

        const name = editForm.name.trim();
        const email = editForm.email
            .trim()
            .toLowerCase();

        if (!name || !email) {
            setError(
                "Name and email are required."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");

            await AdminAPI.put(
                `/users/${selectedUser._id}`,
                {
                    ...editForm,
                    name,
                    email,
                },
                {
                    headers: getHeaders(),
                }
            );

            setUsers((current) =>
                current.map((user) =>
                    user._id ===
                    selectedUser._id
                        ? {
                              ...user,
                              ...editForm,
                              name,
                              email,
                          }
                        : user
                )
            );

            setSelectedUser(null);

            showMessage(
                "User updated successfully."
            );
        } catch (err) {
            console.error(
                "Update user error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to update user."
            );
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // DELETE USER
    // ==========================================

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setDeletingId(deleteTarget._id);
            setError("");

            await AdminAPI.delete(
                `/users/${deleteTarget._id}`,
                {
                    headers: getHeaders(),
                }
            );

            setUsers((current) =>
                current.filter(
                    (user) =>
                        user._id !==
                        deleteTarget._id
                )
            );

            showMessage(
                `${deleteTarget.name} was deleted.`
            );

            setDeleteTarget(null);
        } catch (err) {
            console.error(
                "Delete user error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to delete user."
            );
        } finally {
            setDeletingId(null);
        }
    };

    // ==========================================
    // BAN / UNBAN USER
    // ==========================================

    const handleBan = async (user) => {
        try {
            setBanningId(user._id);
            setError("");

            await AdminAPI.put(
                `/users/${user._id}/ban`,
                {},
                {
                    headers: getHeaders(),
                }
            );

            setUsers((current) =>
                current.map((item) =>
                    item._id === user._id
                        ? {
                              ...item,
                              isBanned:
                                  !item.isBanned,
                          }
                        : item
                )
            );

            showMessage(
                user.isBanned
                    ? `${user.name} has been unbanned.`
                    : `${user.name} has been banned.`
            );
        } catch (err) {
            console.error(
                "Ban user error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to update ban status."
            );
        } finally {
            setBanningId(null);
        }
    };

    // ==========================================
    // SUCCESS MESSAGE
    // ==========================================

    const showMessage = (text) => {
        setMessage(text);

        setTimeout(() => {
            setMessage("");
        }, 3000);
    };

    // ==========================================
    // FILTER USERS
    // ==========================================

    const filteredUsers = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();

        return users.filter((user) => {
            const matchesSearch =
                !query ||
                user.name
                    ?.toLowerCase()
                    .includes(query) ||
                user.email
                    ?.toLowerCase()
                    .includes(query);

            const matchesRole =
                roleFilter === "all" ||
                user.role === roleFilter;

            return (
                matchesSearch &&
                matchesRole
            );
        });
    }, [users, search, roleFilter]);

    // ==========================================
    // STATS
    // ==========================================

    const adminCount = users.filter(
        (user) => user.role === "admin"
    ).length;

    const bannedCount = users.filter(
        (user) => user.isBanned
    ).length;

    const activeCount =
        users.length - bannedCount;

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#08080d] text-white">
                <div className="text-center">

                    <RefreshCw className="mx-auto h-7 w-7 animate-spin text-gray-500" />

                    <p className="mt-4 text-sm text-gray-500">
                        Loading users...
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

                            <UsersIcon
                                size={15}
                                className="text-gray-400"
                            />

                            <p className="text-sm font-medium text-gray-400">
                                Administration
                            </p>

                        </div>

                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            User Management
                        </h1>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
                            Manage CodeGPM accounts,
                            permissions and account
                            restrictions.
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            fetchUsers(true)
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
                        error
                        text={error}
                        onClose={() =>
                            setError("")
                        }
                    />
                )}

                {message && (
                    <Feedback
                        text={message}
                        onClose={() =>
                            setMessage("")
                        }
                    />
                )}

                {/* ==================================
                    STATS
                ================================== */}

                <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <StatCard
                        icon={UsersIcon}
                        value={users.length}
                        title="Total Users"
                        description="Registered accounts"
                    />

                    <StatCard
                        icon={CheckCircle2}
                        value={activeCount}
                        title="Active Users"
                        description="Accounts not banned"
                    />

                    <StatCard
                        icon={Crown}
                        value={adminCount}
                        title="Administrators"
                        description="Admin accounts"
                    />

                    <StatCard
                        icon={Ban}
                        value={bannedCount}
                        title="Banned"
                        description="Restricted accounts"
                    />

                </section>

                {/* ==================================
                    USER TABLE
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

                    {/* TOOLBAR */}

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
                                All Users
                            </h2>

                            <p className="mt-1 text-sm text-gray-600">
                                {filteredUsers.length}{" "}
                                {filteredUsers.length === 1
                                    ? "user"
                                    : "users"}
                            </p>

                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">

                            {/* ROLE FILTER */}

                            <select
                                value={roleFilter}
                                onChange={(e) =>
                                    setRoleFilter(
                                        e.target.value
                                    )
                                }
                                className="
                                    rounded-xl
                                    border
                                    border-white/[0.08]
                                    bg-[#111118]
                                    px-4
                                    py-3
                                    text-sm
                                    text-gray-300
                                    outline-none
                                    focus:border-gray-500/50
                                "
                            >
                                <option value="all">
                                    All roles
                                </option>

                                <option value="user">
                                    Users
                                </option>

                                <option value="admin">
                                    Admins
                                </option>
                            </select>

                            {/* SEARCH */}

                            <div className="relative sm:w-72">

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
                                        placeholder:text-gray-700
                                        focus:border-gray-500/50
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

                    </div>

                    {/* EMPTY */}

                    {users.length === 0 ? (
                        <EmptyState
                            title="No users yet"
                            description="Registered CodeGPM users will appear here."
                        />
                    ) : filteredUsers.length === 0 ? (
                        <EmptyState
                            title="No users found"
                            description="Try changing your search or role filter."
                        />
                    ) : (
                        <>

                            {/* ==============================
                                DESKTOP TABLE
                            ============================== */}

                            <div className="hidden overflow-x-auto lg:block">

                                <table className="w-full">

                                    <thead className="border-b border-white/[0.06] bg-white/[0.015]">

                                        <tr>

                                            <TableHeading>
                                                User
                                            </TableHeading>

                                            <TableHeading>
                                                Email
                                            </TableHeading>

                                            <TableHeading>
                                                Role
                                            </TableHeading>

                                            <TableHeading>
                                                Status
                                            </TableHeading>

                                            <TableHeading right>
                                                Actions
                                            </TableHeading>

                                        </tr>

                                    </thead>

                                    <tbody className="divide-y divide-white/[0.05]">

                                        {filteredUsers.map(
                                            (user) => (
                                                <tr
                                                    key={
                                                        user._id
                                                    }
                                                    className="
                                                        transition
                                                        hover:bg-white/[0.025]
                                                    "
                                                >

                                                    {/* USER */}

                                                    <td className="px-6 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <UserAvatar
                                                                user={
                                                                    user
                                                                }
                                                                size="sm"
                                                            />

                                                            <div className="min-w-0">

                                                                <p className="max-w-48 truncate text-sm font-medium text-gray-200">
                                                                    {user.name ||
                                                                        "Unknown User"}
                                                                </p>

                                                                <p className="mt-0.5 max-w-48 truncate text-xs text-gray-700">
                                                                    ID:{" "}
                                                                    {
                                                                        user._id
                                                                    }
                                                                </p>

                                                            </div>

                                                        </div>

                                                    </td>

                                                    {/* EMAIL */}

                                                    <td className="px-6 py-4">

                                                        <div className="flex items-center gap-2">

                                                            <Mail
                                                                size={
                                                                    14
                                                                }
                                                                className="shrink-0 text-gray-700"
                                                            />

                                                            <span className="max-w-60 truncate text-sm text-gray-500">
                                                                {user.email ||
                                                                    "No email"}
                                                            </span>

                                                        </div>

                                                    </td>

                                                    {/* ROLE */}

                                                    <td className="px-6 py-4">

                                                        <RoleBadge
                                                            role={
                                                                user.role
                                                            }
                                                        />

                                                    </td>

                                                    {/* STATUS */}

                                                    <td className="px-6 py-4">

                                                        <StatusBadge
                                                            banned={
                                                                user.isBanned
                                                            }
                                                        />

                                                    </td>

                                                    {/* ACTIONS */}

                                                    <td className="px-6 py-4">

                                                        <div className="flex items-center justify-end gap-2">

                                                            {/* EDIT */}

                                                            <ActionButton
                                                                title="Edit user"
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        user
                                                                    )
                                                                }
                                                            >
                                                                <Pencil
                                                                    size={
                                                                        15
                                                                    }
                                                                />
                                                            </ActionButton>

                                                            {/* BAN */}

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    banningId ===
                                                                    user._id
                                                                }
                                                                onClick={() =>
                                                                    handleBan(
                                                                        user
                                                                    )
                                                                }
                                                                title={
                                                                    user.isBanned
                                                                        ? "Unban user"
                                                                        : "Ban user"
                                                                }
                                                                className={`
                                                                    flex
                                                                    h-9
                                                                    w-9
                                                                    items-center
                                                                    justify-center
                                                                    rounded-lg
                                                                    border
                                                                    transition
                                                                    disabled:opacity-40

                                                                    ${
                                                                        user.isBanned
                                                                            ? "border-emerald-500/15 bg-emerald-500/[0.06] text-emerald-400 hover:bg-emerald-500/10"
                                                                            : "border-amber-500/15 bg-amber-500/[0.06] text-amber-400 hover:bg-amber-500/10"
                                                                    }
                                                                `}
                                                            >

                                                                {banningId ===
                                                                user._id ? (
                                                                    <RefreshCw
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="animate-spin"
                                                                    />
                                                                ) : user.isBanned ? (
                                                                    <CheckCircle2
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <Ban
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                )}

                                                            </button>

                                                            {/* DELETE */}

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setDeleteTarget(
                                                                        user
                                                                    )
                                                                }
                                                                title="Delete user"
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
                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                            {/* ==============================
                                MOBILE CARDS
                            ============================== */}

                            <div className="divide-y divide-white/[0.06] lg:hidden">

                                {filteredUsers.map(
                                    (user) => (
                                        <div
                                            key={
                                                user._id
                                            }
                                            className="p-5"
                                        >

                                            {/* USER */}

                                            <div className="flex items-start gap-3">

                                                <UserAvatar
                                                    user={
                                                        user
                                                    }
                                                    size="sm"
                                                />

                                                <div className="min-w-0 flex-1">

                                                    <p className="truncate font-medium text-gray-200">
                                                        {user.name ||
                                                            "Unknown User"}
                                                    </p>

                                                    <p className="mt-1 truncate text-xs text-gray-600">
                                                        {user.email ||
                                                            "No email"}
                                                    </p>

                                                </div>

                                            </div>

                                            {/* BADGES */}

                                            <div className="mt-4 flex flex-wrap gap-2">

                                                <RoleBadge
                                                    role={
                                                        user.role
                                                    }
                                                />

                                                <StatusBadge
                                                    banned={
                                                        user.isBanned
                                                    }
                                                />

                                            </div>

                                            {/* ACTIONS */}

                                            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/[0.05] pt-4">

                                                <MobileAction
                                                    icon={
                                                        Pencil
                                                    }
                                                    label="Edit"
                                                    onClick={() =>
                                                        handleEdit(
                                                            user
                                                        )
                                                    }
                                                />

                                                <MobileAction
                                                    icon={
                                                        user.isBanned
                                                            ? CheckCircle2
                                                            : Ban
                                                    }
                                                    label={
                                                        user.isBanned
                                                            ? "Unban"
                                                            : "Ban"
                                                    }
                                                    onClick={() =>
                                                        handleBan(
                                                            user
                                                        )
                                                    }
                                                    disabled={
                                                        banningId ===
                                                        user._id
                                                    }
                                                />

                                                <MobileAction
                                                    icon={
                                                        Trash2
                                                    }
                                                    label="Delete"
                                                    danger
                                                    onClick={() =>
                                                        setDeleteTarget(
                                                            user
                                                        )
                                                    }
                                                />

                                            </div>

                                        </div>
                                    )
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
                            {users.length} users •{" "}
                            {adminCount} admins •{" "}
                            {bannedCount} banned
                        </p>

                    </div>

                </footer>

            </main>

            {/* ==================================
                EDIT USER MODAL
            ================================== */}

            {selectedUser && (
                <div
                    className="
                        fixed
                        inset-0
                        z-100
                        flex
                        items-center
                        justify-center
                        bg-black/75
                        p-4
                        
                    "
                    onClick={() => {
                        if (!saving) {
                            setSelectedUser(null);
                        }
                    }}
                >

                    <div
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                        className="
                            w-full
                            max-w-lg
                            rounded-3xl
                            border
                            border-white/[0.1]
                            bg-[#111118]
                            shadow-2xl
                        "
                    >

                        {/* MODAL HEADER */}

                        <div className="flex items-start justify-between border-b border-white/[0.07] p-6">

                            <div className="flex items-center gap-4">

                                <UserAvatar
                                    user={
                                        selectedUser
                                    }
                                    size="md"
                                />

                                <div>

                                    <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
                                        Edit Account
                                    </p>

                                    <h2 className="mt-1 text-xl font-semibold">
                                        {selectedUser.name}
                                    </h2>

                                </div>

                            </div>

                            <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                    setSelectedUser(
                                        null
                                    )
                                }
                                className="
                                    rounded-lg
                                    p-2
                                    text-gray-600
                                    transition
                                    hover:bg-white/[0.05]
                                    hover:text-white
                                "
                            >
                                <X size={18} />
                            </button>

                        </div>

                        {/* FORM */}

                        <div className="space-y-5 p-6">

                            <FormField
                                label="Name"
                                value={
                                    editForm.name
                                }
                                onChange={(value) =>
                                    setEditForm(
                                        (current) => ({
                                            ...current,
                                            name: value,
                                        })
                                    )
                                }
                                placeholder="User name"
                            />

                            <FormField
                                label="Email address"
                                type="email"
                                value={
                                    editForm.email
                                }
                                onChange={(value) =>
                                    setEditForm(
                                        (current) => ({
                                            ...current,
                                            email: value,
                                        })
                                    )
                                }
                                placeholder="user@example.com"
                            />

                            {/* ROLE */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-400">
                                    Role
                                </label>

                                <select
                                    value={
                                        editForm.role
                                    }
                                    onChange={(e) =>
                                        setEditForm(
                                            (
                                                current
                                            ) => ({
                                                ...current,
                                                role: e
                                                    .target
                                                    .value,
                                            })
                                        )
                                    }
                                    className="
                                        w-full
                                        rounded-xl
                                        border
                                        border-white/[0.08]
                                        bg-[#0c0c12]
                                        px-4
                                        py-3
                                        text-sm
                                        text-white
                                        outline-none
                                        transition
                                        focus:border-gray-500/50
                                    "
                                >

                                    <option value="user">
                                        User
                                    </option>

                                    <option value="admin">
                                        Admin
                                    </option>

                                </select>

                                {editForm.role ===
                                    "admin" && (
                                    <div
                                        className="
                                            mt-3
                                            flex
                                            gap-3
                                            rounded-xl
                                            border
                                            border-amber-500/10
                                            bg-amber-500/[0.05]
                                            p-3
                                        "
                                    >
                                        <ShieldCheck
                                            size={16}
                                            className="mt-0.5 shrink-0 text-amber-400"
                                        />

                                        <p className="text-xs leading-5 text-amber-200/70">
                                            Admins can
                                            access the
                                            administration
                                            area and
                                            management
                                            endpoints.
                                        </p>
                                    </div>
                                )}

                            </div>

                        </div>

                        {/* FOOTER */}

                        <div className="flex justify-end gap-3 border-t border-white/[0.07] p-6">

                            <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                    setSelectedUser(
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
                                disabled={saving}
                                onClick={saveUser}
                                className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    rounded-xl
                                    bg-gray-600
                                    px-5
                                    py-2.5
                                    text-sm
                                    font-medium
                                    text-white
                                    transition
                                    hover:bg-gray-500
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >

                                {saving ? (
                                    <RefreshCw
                                        size={15}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Save
                                        size={15}
                                    />
                                )}

                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}

                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* ==================================
                DELETE MODAL
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
                        p-4
                        
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

                        <h2 className="mt-5 text-xl font-semibold">
                            Delete user?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            You're about to permanently
                            delete{" "}
                            <span className="font-medium text-gray-300">
                                {deleteTarget.name}
                            </span>
                            . This action cannot be
                            undone.
                        </p>

                        <div
                            className="
                                mt-4
                                rounded-xl
                                border
                                border-red-500/10
                                bg-red-500/[0.04]
                                px-4
                                py-3
                            "
                        >
                            <p className="text-xs text-red-300/70">
                                {
                                    deleteTarget.email
                                }
                            </p>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">

                            <button
                                type="button"
                                disabled={
                                    Boolean(
                                        deletingId
                                    )
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
                                    Boolean(
                                        deletingId
                                    )
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
                                    : "Delete User"}

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
    title,
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

            <p className="mt-5 text-2xl font-semibold">
                {value}
            </p>

            <p className="mt-1 text-sm font-medium text-gray-300">
                {title}
            </p>

            <p className="mt-1 text-xs text-gray-600">
                {description}
            </p>

        </div>
    );
}

// ==========================================
// ROLE BADGE
// ==========================================

function RoleBadge({ role }) {
    const admin = role === "admin";

    return (
        <span
            className={`
                inline-flex
                items-center
                gap-1.5
                rounded-lg
                border
                px-2.5
                py-1.5
                text-xs
                font-medium

                ${
                    admin
                        ? "border-gray-500/15 bg-gray-500/[0.08] text-gray-300"
                        : "border-white/[0.07] bg-white/[0.03] text-gray-400"
                }
            `}
        >

            {admin ? (
                <Crown size={12} />
            ) : (
                <UserRound size={12} />
            )}

            {admin ? "Admin" : "User"}

        </span>
    );
}

// ==========================================
// STATUS BADGE
// ==========================================

function StatusBadge({ banned }) {
    return (
        <span
            className={`
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                px-2.5
                py-1
                text-xs

                ${
                    banned
                        ? "border-red-500/15 bg-red-500/[0.06] text-red-400"
                        : "border-emerald-500/15 bg-emerald-500/[0.06] text-emerald-400"
                }
            `}
        >

            <span
                className={`
                    h-1.5
                    w-1.5
                    rounded-full

                    ${
                        banned
                            ? "bg-red-400"
                            : "bg-emerald-400"
                    }
                `}
            />

            {banned ? "Banned" : "Active"}

        </span>
    );
}

// ==========================================
// ACTION BUTTON
// ==========================================

function ActionButton({
    children,
    onClick,
    title,
}) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
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
                hover:border-gray-500/20
                hover:bg-gray-500/10
                hover:text-gray-300
            "
        >
            {children}
        </button>
    );
}

// ==========================================
// MOBILE ACTION
// ==========================================

function MobileAction({
    icon: Icon,
    label,
    onClick,
    danger = false,
    disabled = false,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                px-3
                py-2.5
                text-xs
                transition
                disabled:opacity-40

                ${
                    danger
                        ? "border-red-500/10 bg-red-500/[0.05] text-red-400"
                        : "border-white/[0.07] bg-white/[0.03] text-gray-400"
                }
            `}
        >
            <Icon size={14} />
            {label}
        </button>
    );
}

// ==========================================
// FORM FIELD
// ==========================================

function FormField({
    label,
    type = "text",
    value,
    onChange,
    placeholder,
}) {
    return (
        <div>

            <label className="mb-2 block text-sm font-medium text-gray-400">
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={(e) =>
                    onChange(e.target.value)
                }
                placeholder={placeholder}
                className="
                    w-full
                    rounded-xl
                    border
                    border-white/[0.08]
                    bg-[#0c0c12]
                    px-4
                    py-3
                    text-sm
                    text-white
                    outline-none
                    transition
                    placeholder:text-gray-700
                    focus:border-gray-500/50
                "
            />

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
                <UsersIcon size={24} />
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
    error = false,
    text,
    onClose,
}) {
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

            <span>{text}</span>

            <button
                type="button"
                onClick={onClose}
                className="opacity-60 transition hover:opacity-100"
            >
                <X size={16} />
            </button>

        </div>
    );
}

export default Users;
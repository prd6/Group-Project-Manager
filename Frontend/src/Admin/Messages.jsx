import {
    Mail,
    MailOpen,
    RefreshCw,
    Star,
    Trash2,
    X,
    Inbox,
    User,
    Calendar,
    ExternalLink,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { API_ORIGIN } from "../services/apiConfig";

const Messages = () => {
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [displaying, setDisplaying] = useState(null);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const authHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    const syncMessageState = useCallback(
        (updatedMessage) => {
            setMessages((current) =>
                current.map((item) =>
                    item._id === updatedMessage._id
                        ? updatedMessage
                        : item
                )
            );

            setSelectedMessage((current) =>
                current?._id === updatedMessage._id
                    ? updatedMessage
                    : current
            );
        },
        []
    );

    // ==========================================
    // FETCH MESSAGES
    // ==========================================

    const fetchMessages = useCallback(
        async (showRefresh = false) => {
            try {
                if (showRefresh) {
                    setRefreshing(true);
                }

                setError("");

                const response = await fetch(
                    `${API_ORIGIN}/api/contact/admin`,
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
                            "Failed to load messages."
                    );
                }

                setMessages(data.messages || []);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [token]
    );

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // ==========================================
    // OPEN MESSAGE
    // ==========================================

    const openMessage = async (message) => {
        setSelectedMessage(message);

        if (message.status === "read") {
            return;
        }

        try {
            const response = await fetch(
                `${API_ORIGIN}/api/contact/admin/${message._id}/read`,
                {
                    method: "PATCH",
                    headers: authHeaders,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to mark message as read."
                );
            }

            setMessages((current) =>
                current.map((item) =>
                    item._id === message._id
                        ? {
                              ...item,
                              status: "read",
                          }
                        : item
                )
            );

            setSelectedMessage((current) =>
                current
                    ? {
                          ...current,
                          status: "read",
                      }
                    : current
            );
        } catch (error) {
            console.error(error);
        }
    };

    // ==========================================
    // MARK UNREAD
    // ==========================================

    const markUnread = async (message) => {
        try {
            const response = await fetch(
                `${API_ORIGIN}/api/contact/admin/${message._id}/unread`,
                {
                    method: "PATCH",
                    headers: authHeaders,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to mark as unread."
                );
            }

            setMessages((current) =>
                current.map((item) =>
                    item._id === message._id
                        ? {
                              ...item,
                              status: "unread",
                          }
                        : item
                )
            );

            setSelectedMessage(null);
        } catch (error) {
            setError(error.message);
        }
    };

    // ==========================================
    // DISPLAY ON HOME
    // ==========================================

    const toggleDisplayOnHome = async (message) => {
        try {
            setDisplaying(message._id);
            setError("");

            const response = await fetch(
                `${API_ORIGIN}/api/contact/admin/${message._id}/display`,
                {
                    method: "PATCH",
                    headers: authHeaders,
                    body: JSON.stringify({
                        displayOnHome:
                            !message.displayOnHome,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to update display status."
                );
            }

            if (data.contact) {
                syncMessageState(data.contact);
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setDisplaying(null);
        }
    };

    // ==========================================
    // DELETE
    // ==========================================

    const deleteMessage = async (id) => {
        const confirmed = window.confirm(
            "Delete this message permanently?"
        );

        if (!confirmed) return;

        try {
            setDeleting(id);

            const response = await fetch(
                `${API_ORIGIN}/api/contact/admin/${id}`,
                {
                    method: "DELETE",
                    headers: authHeaders,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to delete message."
                );
            }

            setMessages((current) =>
                current.filter(
                    (message) => message._id !== id
                )
            );

            if (selectedMessage?._id === id) {
                setSelectedMessage(null);
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setDeleting(null);
        }
    };

    const unreadCount = messages.filter(
        (message) => message.status === "unread"
    ).length;

    const formatDate = (date) => {
        return new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#08080d]">
                <RefreshCw className="h-7 w-7 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#08080d] p-5 text-white md:p-8">

            <div className="mx-auto max-w-7xl">

                {/* HEADER */}

                <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

                    <div>
                        <p className="mb-2 text-sm font-medium text-violet-400">
                            Admin
                        </p>

                        <h1 className="text-3xl font-bold">
                            Messages
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Messages and feedback sent through
                            CodeGPM.
                        </p>
                    </div>

                    <button
                        onClick={() => fetchMessages(true)}
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
                            disabled:opacity-50
                        "
                    >
                        <RefreshCw
                            size={16}
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        Refresh
                    </button>

                </div>

                {/* STATS */}

                <div className="mb-6 grid gap-4 sm:grid-cols-3">

                    <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
                        <p className="text-sm text-gray-500">
                            Total
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                            {messages.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
                        <p className="text-sm text-violet-300">
                            Unread
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                            {unreadCount}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
                        <p className="text-sm text-gray-500">
                            Read
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                            {messages.length - unreadCount}
                        </p>
                    </div>

                </div>

                {error && (
                    <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {/* INBOX */}

                <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/3">

                    <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
                        <Inbox
                            size={19}
                            className="text-violet-400"
                        />

                        <h2 className="font-semibold">
                            Inbox
                        </h2>

                        {unreadCount > 0 && (
                            <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs font-medium">
                                {unreadCount}
                            </span>
                        )}
                    </div>

                    {messages.length === 0 ? (
                        <div className="px-6 py-20 text-center">

                            <Mail
                                size={38}
                                className="mx-auto text-gray-700"
                            />

                            <h3 className="mt-5 font-medium text-gray-300">
                                No messages yet
                            </h3>

                            <p className="mt-2 text-sm text-gray-600">
                                Contact form submissions will
                                appear here.
                            </p>

                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">

                            {messages.map((message) => {
                                const unread =
                                    message.status === "unread";

                                return (
                                    <button
                                        key={message._id}
                                        type="button"
                                        onClick={() =>
                                            openMessage(message)
                                        }
                                        className={`
                                            group
                                            flex
                                            w-full
                                            items-start
                                            gap-4
                                            px-6
                                            py-5
                                            text-left
                                            transition

                                            ${
                                                unread
                                                    ? "bg-violet-500/[0.06] hover:bg-violet-500/[0.1]"
                                                    : "hover:bg-white/[0.04]"
                                            }
                                        `}
                                    >

                                        {/* STATUS */}

                                        <div
                                            className={`
                                                mt-1
                                                flex
                                                h-10
                                                w-10
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-xl

                                                ${
                                                    unread
                                                        ? "bg-violet-500/15 text-violet-300"
                                                        : "bg-white/5 text-gray-600"
                                                }
                                            `}
                                        >
                                            {unread ? (
                                                <Mail size={18} />
                                            ) : (
                                                <MailOpen size={18} />
                                            )}
                                        </div>

                                        {/* MESSAGE */}

                                        <div className="min-w-0 flex-1">

                                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                                                <div className="flex items-center gap-2">
                                                    <p
                                                        className={
                                                            unread
                                                                ? "font-semibold text-white"
                                                                : "font-medium text-gray-400"
                                                        }
                                                    >
                                                        {message.name}
                                                    </p>

                                                    {message.displayOnHome && (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                                                            <Star size={10} />
                                                            Displayed
                                                        </span>
                                                    )}
                                                </div>

                                                <span className="text-xs text-gray-600">
                                                    {formatDate(
                                                        message.createdAt
                                                    )}
                                                </span>

                                            </div>

                                            <p className="mt-1 truncate text-sm text-gray-500">
                                                {message.email}
                                            </p>

                                            <p
                                                className={`
                                                    mt-2
                                                    line-clamp-1
                                                    text-sm

                                                    ${
                                                        unread
                                                            ? "text-gray-300"
                                                            : "text-gray-600"
                                                    }
                                                `}
                                            >
                                                {message.message}
                                            </p>

                                        </div>

                                        {unread && (
                                            <span className="mt-4 h-2 w-2 shrink-0 rounded-full bg-violet-400" />
                                        )}

                                    </button>
                                );
                            })}

                        </div>
                    )}
                </div>
            </div>

            {/* ==========================================
                MESSAGE MODAL
            ========================================== */}

            {selectedMessage && (
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
                        backdrop-blur-sm
                    "
                    onClick={() =>
                        setSelectedMessage(null)
                    }
                >
                    <div
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                        className="
                            max-h-[90vh]
                            w-full
                            max-w-2xl
                            overflow-y-auto
                            rounded-3xl
                            border
                            border-white/10
                            bg-[#111118]
                            shadow-2xl
                        "
                    >

                        {/* MODAL HEADER */}

                        <div className="flex items-start justify-between border-b border-white/10 p-6">

                            <div>
                                <p className="text-xs font-medium uppercase tracking-widest text-violet-400">
                                    Contact Message
                                </p>

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <h2 className="text-xl font-semibold">
                                        {selectedMessage.name}
                                    </h2>

                                    {selectedMessage.displayOnHome && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                                            <Star size={10} />
                                            Displayed
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() =>
                                    setSelectedMessage(null)
                                }
                                className="rounded-xl p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
                            >
                                <X size={20} />
                            </button>

                        </div>

                        {/* SENDER */}

                        <div className="space-y-4 border-b border-white/10 p-6">

                            <div className="flex items-center gap-3">

                                <User
                                    size={17}
                                    className="text-gray-600"
                                />

                                <span className="text-sm text-gray-300">
                                    {selectedMessage.name}
                                </span>

                            </div>

                            <div className="flex items-center gap-3">

                                <Mail
                                    size={17}
                                    className="text-gray-600"
                                />

                                <a
                                    href={`mailto:${selectedMessage.email}`}
                                    className="flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200"
                                >
                                    {selectedMessage.email}

                                    <ExternalLink size={12} />
                                </a>

                            </div>

                            <div className="flex items-center gap-3">

                                <Calendar
                                    size={17}
                                    className="text-gray-600"
                                />

                                <span className="text-sm text-gray-500">
                                    {formatDate(
                                        selectedMessage.createdAt
                                    )}
                                </span>

                            </div>

                        </div>

                        {/* CONTENT */}

                        <div className="p-6">

                            <p className="whitespace-pre-wrap break-words leading-7 text-gray-300">
                                {selectedMessage.message}
                            </p>

                        </div>

                        {/* ACTIONS */}

                        <div className="flex flex-col gap-3 border-t border-white/10 p-6 sm:flex-row sm:justify-between">

                            <button
                                onClick={() =>
                                    deleteMessage(
                                        selectedMessage._id
                                    )
                                }
                                disabled={
                                    deleting ===
                                    selectedMessage._id
                                }
                                className="
                                    inline-flex
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    border
                                    border-red-500/20
                                    bg-red-500/10
                                    px-4
                                    py-2.5
                                    text-sm
                                    text-red-300
                                    transition
                                    hover:bg-red-500/20
                                    disabled:opacity-50
                                "
                            >
                                <Trash2 size={16} />

                                {deleting ===
                                selectedMessage._id
                                    ? "Deleting..."
                                    : "Delete"}
                            </button>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() =>
                                        toggleDisplayOnHome(
                                            selectedMessage
                                        )
                                    }
                                    disabled={
                                        displaying ===
                                        selectedMessage._id
                                    }
                                    className={`
                                        inline-flex
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-xl
                                        px-4
                                        py-2.5
                                        text-sm
                                        transition
                                        disabled:opacity-50
                                        ${
                                            selectedMessage.displayOnHome
                                                ? "border border-amber-500/20 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
                                                : "border border-violet-500/20 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20"
                                        }
                                    `}
                                >
                                    <Star size={16} />
                                    {displaying ===
                                    selectedMessage._id
                                        ? "Updating..."
                                        : selectedMessage.displayOnHome
                                          ? "Remove from Home"
                                          : "Display"}
                                </button>

                                <button
                                    onClick={() =>
                                        markUnread(
                                            selectedMessage
                                        )
                                    }
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
                                    "
                                >
                                    <Mail size={16} />
                                    Mark unread
                                </button>

                                <a
                                    href={`mailto:${selectedMessage.email}`}
                                    className="
                                        inline-flex
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-xl
                                        bg-violet-600
                                        px-4
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-white
                                        transition
                                        hover:bg-violet-500
                                    "
                                >
                                    Reply
                                </a>

                            </div>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default Messages;

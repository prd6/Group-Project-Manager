import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import socket from "../services/socket";

export default function GroupChat({ groupId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [chats, setChats] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const messagesEndRef = useRef(null);

    // ==========================================
    // SOCKET CONNECTION
    // ==========================================

    useEffect(() => {
        if (!groupId) return;

        if (!socket.connected) {
            socket.connect();
        }

        socket.emit("join-group", groupId);

        const handleReceiveMessage = (newChat) => {
            setChats((previousChats) => {
                // Prevent duplicate message
                const exists = previousChats.some(
                    (chat) => chat._id === newChat._id
                );

                if (exists) {
                    return previousChats;
                }

                return [...previousChats, newChat];
            });
        };

        socket.on("receive-message", handleReceiveMessage);

        return () => {
            socket.off(
                "receive-message",
                handleReceiveMessage
            );
        };
    }, [groupId]);


    // ==========================================
    // LOAD SAVED CHAT
    // ==========================================

    useEffect(() => {
        if (!groupId) return;

        const fetchChats = async () => {
            try {
                setLoading(true);
                setError("");

                const token =
                    localStorage.getItem("token");

                const response = await fetch(
                    `http://localhost:5000/api/chat/${groupId}`,
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
                            "Failed to load chat."
                    );
                }

                setChats(data.chats || []);
            } catch (error) {
                console.error(
                    "Failed to load chat:",
                    error
                );

                setError(
                    error.message ||
                        "Failed to load chat."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchChats();
    }, [groupId]);


    // ==========================================
    // AUTO SCROLL
    // ==========================================

    useEffect(() => {
        if (!isOpen) return;

        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [chats, isOpen]);


    // ==========================================
    // SEND MESSAGE
    // ==========================================

    const sendMessage = async () => {
        const content = message.trim();

        if (!content || sending || !groupId) {
            return;
        }

        try {
            setSending(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `http://localhost:5000/api/chat/${groupId}`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        content,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to send message."
                );
            }

            const newChat = data.chat;

            // Add immediately for sender
            setChats((previousChats) => {
                const exists = previousChats.some(
                    (chat) =>
                        chat._id === newChat._id
                );

                if (exists) {
                    return previousChats;
                }

                return [
                    ...previousChats,
                    newChat,
                ];
            });

            // Send to other connected users
            socket.emit("send-message", {
                groupId,
                message: newChat,
            });

            setMessage("");
        } catch (error) {
            console.error(
                "Failed to send message:",
                error
            );

            setError(
                error.message ||
                    "Failed to send message."
            );
        } finally {
            setSending(false);
        }
    };


    // ==========================================
    // ENTER TO SEND
    // ==========================================

    const handleKeyDown = (event) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();
            sendMessage();
        }
    };


    // ==========================================
    // FORMAT TIME
    // ==========================================

    const formatTime = (date) => {
        if (!date) return "";

        return new Date(date).toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };


    return (
        <div className="fixed bottom-6 right-6 z-50">

            {/* ==================================
                CHAT WINDOW
            ================================== */}

            {isOpen && (
                <div
                    className="
                        absolute
                        bottom-20
                        right-0
                        flex
                        h-[500px]
                        w-[360px]
                        max-w-[calc(100vw-3rem)]
                        flex-col
                        overflow-hidden
                        rounded-3xl
                        border
                        border-white/[0.08]
                        bg-[#0d0d14]
                        shadow-[0_25px_80px_rgba(0,0,0,0.6)]
                    "
                >

                    {/* HEADER */}

                    <div
                        className="
                            flex
                            items-center
                            justify-between
                            border-b
                            border-white/[0.07]
                            px-5
                            py-4
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
                                    text-violet-400
                                "
                            >
                                <MessageCircle size={19} />
                            </div>

                            <div>
                                <h2 className="text-sm font-semibold text-white">
                                    Group Chat
                                </h2>

                                <p className="mt-0.5 text-xs text-gray-600">
                                    Team conversation
                                </p>
                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setIsOpen(false)
                            }
                            className="
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-lg
                                text-gray-500
                                transition
                                hover:bg-white/[0.06]
                                hover:text-white
                            "
                        >
                            <X size={17} />
                        </button>

                    </div>


                    {/* ==================================
                        MESSAGES
                    ================================== */}

                    <div
                        className="
                            flex-1
                            space-y-4
                            overflow-y-auto
                            px-4
                            py-5
                        "
                    >

                        {loading && (
                            <p className="text-center text-xs text-gray-600">
                                Loading messages...
                            </p>
                        )}


                        {!loading &&
                            chats.length === 0 && (
                                <div className="flex h-full flex-col items-center justify-center text-center">

                                    <div
                                        className="
                                            flex
                                            h-12
                                            w-12
                                            items-center
                                            justify-center
                                            rounded-2xl
                                            bg-violet-500/10
                                            text-violet-400
                                        "
                                    >
                                        <MessageCircle
                                            size={21}
                                        />
                                    </div>

                                    <p className="mt-4 text-sm font-medium text-gray-300">
                                        No messages yet
                                    </p>

                                    <p className="mt-1 text-xs text-gray-600">
                                        Start the group conversation.
                                    </p>

                                </div>
                            )}


                        {!loading &&
                            chats.map((chat) => (
                                <div
                                    key={chat._id}
                                    className="
                                        rounded-2xl
                                        border
                                        border-white/[0.05]
                                        bg-white/[0.03]
                                        p-3.5
                                    "
                                >

                                    <div className="flex items-center justify-between gap-3">

                                        <p className="truncate text-xs font-medium text-violet-300">
                                            {chat.sender?.name ||
                                                "User"}
                                        </p>

                                        <span className="shrink-0 text-[10px] text-gray-700">
                                            {formatTime(
                                                chat.createdAt
                                            )}
                                        </span>

                                    </div>

                                    <p className="mt-2 wrap-break-word text-sm leading-6 text-gray-300">
                                        {chat.content}
                                    </p>

                                </div>
                            ))}


                        <div ref={messagesEndRef} />

                    </div>


                    {/* ERROR */}

                    {error && (
                        <div className="px-4 pb-2">
                            <p className="text-xs text-red-400">
                                {error}
                            </p>
                        </div>
                    )}


                    {/* ==================================
                        INPUT
                    ================================== */}

                    <div
                        className="
                            border-t
                            border-white/[0.07]
                            bg-black/20
                            p-3
                        "
                    >

                        <div
                            className="
                                flex
                                items-center
                                gap-2
                                rounded-2xl
                                border
                                border-white/[0.07]
                                bg-white/[0.035]
                                p-1.5
                                focus-within:border-violet-500/30
                            "
                        >

                            <input
                                type="text"
                                value={message}
                                onChange={(event) =>
                                    setMessage(
                                        event.target.value
                                    )
                                }
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                maxLength={2000}
                                className="
                                    min-w-0
                                    flex-1
                                    bg-transparent
                                    px-3
                                    py-2
                                    text-sm
                                    text-white
                                    outline-none
                                    placeholder:text-gray-700
                                "
                            />

                            <button
                                type="button"
                                onClick={sendMessage}
                                disabled={
                                    !message.trim() ||
                                    sending
                                }
                                className="
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-violet-600
                                    text-white
                                    transition
                                    hover:bg-violet-500
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                "
                            >
                                <Send size={15} />
                            </button>

                        </div>

                    </div>

                </div>
            )}


            {/* ==================================
                FLOATING BUTTON
            ================================== */}

            <button
                type="button"
                onClick={() =>
                    setIsOpen((previous) => !previous)
                }
                className="
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-violet-400/20
                    bg-violet-600
                    text-white
                    shadow-[0_15px_50px_rgba(124,58,237,0.35)]
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:bg-violet-500
                "
            >
                {isOpen ? (
                    <X size={21} />
                ) : (
                    <MessageCircle size={22} />
                )}
            </button>

        </div>
    );
}
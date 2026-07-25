import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronUp,
  CornerDownLeft,
  Eraser,
  FileUp,
  LoaderCircle,
  MessageCircle,
  MoreHorizontal,
  PencilLine,
  Send,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import UserAvatar from "./UserAvatar";
import socket, { connectSocket, disconnectSocket } from "../services/socket";
import { buildApiUrl, parseApiResponse } from "../services/apiConfig";

const PAGE_SIZE = 40;
const CHAT_MAX_LENGTH = 2000;
const EDIT_DELETE_WINDOW_MS = 24 * 60 * 60 * 1000;
const POPUP_TIMEOUT_MS = 4500;

const SOCKET_EVENTS = {
  GROUP_JOIN: "group:join",
  GROUP_LEAVE: "group:leave",
  CHAT_NEW: "chat:new",
  CHAT_UPDATED: "chat:updated",
  CHAT_DELETED: "chat:deleted",
  CHAT_CLEARED: "chat:cleared",
};

const parseStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const compareChats = (firstChat, secondChat) => {
  const firstTime = new Date(firstChat?.createdAt || 0).getTime();
  const secondTime = new Date(secondChat?.createdAt || 0).getTime();

  if (firstTime !== secondTime) {
    return firstTime - secondTime;
  }

  return String(firstChat?._id || "").localeCompare(String(secondChat?._id || ""));
};

const upsertChat = (existingChats, nextChat) => {
  const existingIndex = existingChats.findIndex((chat) => chat._id === nextChat._id);

  if (existingIndex === -1) {
    return [...existingChats, nextChat].sort(compareChats);
  }

  const nextChats = [...existingChats];
  nextChats[existingIndex] = nextChat;
  return nextChats.sort(compareChats);
};

const prependOlderChats = (existingChats, olderChats) => {
  const chatMap = new Map();

  [...olderChats, ...existingChats].forEach((chat) => {
    chatMap.set(chat._id, chat);
  });

  return [...chatMap.values()].sort(compareChats);
};

const getAuthHeaders = (includeJson = false) => {
  const token = localStorage.getItem("token");

  return {
    ...(includeJson
      ? {
          "Content-Type": "application/json",
        }
      : {}),
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
};

const isOwnMessage = (chat, currentUser) => {
  const senderId = chat?.sender?._id || chat?.sender?.id || "";
  const currentUserId = currentUser?._id || currentUser?.id || "";

  return Boolean(senderId && currentUserId && senderId === currentUserId);
};

const getChatType = (chat) => chat?.type || "text";

const isEditableMessage = (chat, currentUser) => {
  if (!chat || !currentUser || getChatType(chat) !== "text" || chat.isDeleted) {
    return false;
  }

  if (!isOwnMessage(chat, currentUser)) {
    return false;
  }

  const createdAt = new Date(chat.createdAt).getTime();

  return Date.now() - createdAt <= EDIT_DELETE_WINDOW_MS;
};

const formatUnreadCount = (count) => {
  if (count > 99) {
    return "99+";
  }

  if (count > 9) {
    return "9+";
  }

  return String(count);
};

const formatTime = (value) =>
  new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDateLabel = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });

const getConnectionPill = (connectionState) => {
  if (connectionState === "connected") {
    return {
      label: "Live",
      icon: Wifi,
      className:
        "border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-300",
    };
  }

  if (connectionState === "connecting") {
    return {
      label: "Connecting",
      icon: LoaderCircle,
      className: "border-amber-500/15 bg-amber-500/[0.08] text-amber-300",
      spin: true,
    };
  }

  return {
    label: "Offline",
    icon: WifiOff,
    className: "border-red-500/15 bg-red-500/[0.08] text-red-300",
  };
};

const buildNotificationPreview = (chat) => {
  if (getChatType(chat) === "file_upload") {
    return chat.content;
  }

  if (getChatType(chat) === "file_delete") {
    return chat.content;
  }

  if (chat.isDeleted) {
    return "Message deleted";
  }

  return chat.content;
};

export default function GroupChat({ groupId }) {
  const [currentUser, setCurrentUser] = useState(parseStoredUser);
  const [groupName, setGroupName] = useState("Group Chat");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [clearChatOpen, setClearChatOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState("");
  const [submittingAction, setSubmittingAction] = useState("");
  const [connectionState, setConnectionState] = useState(
    socket.connected ? "connected" : "connecting"
  );

  const scrollContainerRef = useRef(null);
  const composerRef = useRef(null);
  const activeGroupIdRef = useRef(groupId);
  const currentUserRef = useRef(currentUser);
  const isOpenRef = useRef(isOpen);
  const popupTimeoutsRef = useRef(new Map());
  const scrollRestoreRef = useRef(null);
  const shouldScrollToBottomRef = useRef(false);

  const connectionPill = useMemo(
    () => getConnectionPill(connectionState),
    [connectionState]
  );

  const canClearChat = currentUserRole === "Owner";

  const clearNotificationTimeouts = () => {
    popupTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    popupTimeoutsRef.current.clear();
  };

  const scrollToBottom = (behavior = "smooth") => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  };

  const resetComposerHeight = () => {
    const textarea = composerRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
  };

  const openChat = () => {
    setIsOpen(true);
    setUnreadCount(0);
    setNotifications([]);
    clearNotificationTimeouts();
    shouldScrollToBottomRef.current = true;
  };

  const closeChat = () => {
    setIsOpen(false);
    setActiveMenuId("");
  };

  const queueNotification = (chat) => {
    const notificationId = `${chat._id}-${Date.now()}`;
    const senderName = chat?.sender?.name || "Group member";
    const preview = buildNotificationPreview(chat);

    const timeoutId = window.setTimeout(() => {
      setNotifications((previousNotifications) =>
        previousNotifications.filter(
          (notification) => notification.id !== notificationId
        )
      );
      popupTimeoutsRef.current.delete(notificationId);
    }, POPUP_TIMEOUT_MS);

    popupTimeoutsRef.current.set(notificationId, timeoutId);

    setNotifications((previousNotifications) => {
      const trimmedNotifications = previousNotifications.slice(-2);

      return [
        ...trimmedNotifications,
        {
          id: notificationId,
          senderName,
          preview,
        },
      ];
    });
  };

  const joinCurrentGroupRoom = async (nextGroupId) =>
    new Promise((resolve, reject) => {
      socket.emit(SOCKET_EVENTS.GROUP_JOIN, nextGroupId, (response) => {
        if (response?.success) {
          resolve(response);
          return;
        }

        reject(new Error(response?.message || "Failed to join group chat"));
      });
    });

  const fetchMessages = async ({ before = "", mode = "initial" } = {}) => {
    if (!groupId) {
      return;
    }

    const isOlderRequest = mode === "older";
    const requestedGroupId = groupId;
    const searchParams = new URLSearchParams({
      limit: String(PAGE_SIZE),
    });

    if (before) {
      searchParams.set("before", before);
    }

    try {
      if (isOlderRequest) {
        setLoadingOlder(true);
      } else {
        setLoading(true);
        setError("");
      }

      const response = await fetch(
        buildApiUrl(`/api/chat/${groupId}?${searchParams.toString()}`),
        {
          headers: getAuthHeaders(),
        }
      );

      const { data, errorMessage } = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(errorMessage || "Failed to load messages.");
      }

      if (activeGroupIdRef.current !== requestedGroupId) {
        return;
      }

      const nextChats = Array.isArray(data?.chats) ? data.chats : [];

      setGroupName(data?.group?.groupName || "Group Chat");
      setCurrentUserRole(data?.group?.currentUserRole || "");
      setHasMore(Boolean(data?.pagination?.hasMore));
      setNextCursor(data?.pagination?.nextCursor || null);

      if (isOlderRequest) {
        setChats((previousChats) => prependOlderChats(previousChats, nextChats));
      } else {
        setChats(nextChats.sort(compareChats));
        shouldScrollToBottomRef.current = true;
      }
    } catch (fetchError) {
      console.error("Failed to load chat:", fetchError);
      setError(fetchError.message || "Failed to load chat.");

      if (!isOlderRequest) {
        setChats([]);
        setHasMore(false);
        setNextCursor(null);
      }
    } finally {
      if (isOlderRequest) {
        setLoadingOlder(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleLoadOlder = async () => {
    if (!hasMore || !nextCursor || loadingOlder) {
      return;
    }

    const container = scrollContainerRef.current;

    if (container) {
      scrollRestoreRef.current = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
      };
    }

    await fetchMessages({
      before: nextCursor,
      mode: "older",
    });
  };

  const handleSendMessage = async () => {
    const content = message.trim();

    if (!content || sending || !groupId) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const response = await fetch(buildApiUrl(`/api/chat/${groupId}`), {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          content,
        }),
      });

      const { data, errorMessage } = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(errorMessage || "Failed to send message.");
      }

      if (data?.chat) {
        setChats((previousChats) => upsertChat(previousChats, data.chat));
        shouldScrollToBottomRef.current = true;
      }

      setMessage("");
    } catch (sendError) {
      console.error("Failed to send message:", sendError);
      setError(sendError.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleSaveEdit = async () => {
    const content = editingContent.trim();

    if (!content || !editingMessageId || submittingAction === "editing") {
      return;
    }

    try {
      setSubmittingAction("editing");
      setError("");

      const response = await fetch(
        buildApiUrl(`/api/chat/${groupId}/${editingMessageId}`),
        {
          method: "PATCH",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            content,
          }),
        }
      );

      const { data, errorMessage } = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(errorMessage || "Failed to edit message.");
      }

      if (data?.chat) {
        setChats((previousChats) => upsertChat(previousChats, data.chat));
      }

      setEditingMessageId("");
      setEditingContent("");
      setActiveMenuId("");
    } catch (editError) {
      console.error("Failed to edit message:", editError);
      setError(editError.message || "Failed to edit message.");
    } finally {
      setSubmittingAction("");
    }
  };

  const handleDeleteMessage = async () => {
    if (!deleteTarget || submittingAction === "deleting") {
      return;
    }

    try {
      setSubmittingAction("deleting");
      setError("");

      const response = await fetch(
        buildApiUrl(`/api/chat/${groupId}/${deleteTarget._id}`),
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const { data, errorMessage } = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(errorMessage || "Failed to delete message.");
      }

      if (data?.chat) {
        setChats((previousChats) => upsertChat(previousChats, data.chat));
      }

      setDeleteTarget(null);
      setActiveMenuId("");
    } catch (deleteError) {
      console.error("Failed to delete message:", deleteError);
      setError(deleteError.message || "Failed to delete message.");
    } finally {
      setSubmittingAction("");
    }
  };

  const handleClearChat = async () => {
    if (!canClearChat || submittingAction === "clearing") {
      return;
    }

    try {
      setSubmittingAction("clearing");
      setError("");

      const response = await fetch(buildApiUrl(`/api/chat/${groupId}/clear`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const { errorMessage } = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(errorMessage || "Failed to clear chat.");
      }

      setChats([]);
      setHasMore(false);
      setNextCursor(null);
      setClearChatOpen(false);
      setActiveMenuId("");
      shouldScrollToBottomRef.current = true;
    } catch (clearError) {
      console.error("Failed to clear chat:", clearError);
      setError(clearError.message || "Failed to clear chat.");
    } finally {
      setSubmittingAction("");
    }
  };

  useEffect(() => {
    const handleUserUpdated = (event) => {
      setCurrentUser(event.detail || null);
    };

    window.addEventListener("user-updated", handleUserUpdated);

    return () => {
      window.removeEventListener("user-updated", handleUserUpdated);
    };
  }, []);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    resetComposerHeight();
  }, [message, editingContent]);

  useEffect(() => {
    if (scrollRestoreRef.current && scrollContainerRef.current) {
      const { scrollHeight, scrollTop } = scrollRestoreRef.current;
      const container = scrollContainerRef.current;

      container.scrollTop = container.scrollHeight - scrollHeight + scrollTop;
      scrollRestoreRef.current = null;
      return;
    }

    if (shouldScrollToBottomRef.current && isOpen) {
      scrollToBottom(chats.length > PAGE_SIZE ? "auto" : "smooth");
      shouldScrollToBottomRef.current = false;
    }
  }, [chats, isOpen]);

  useEffect(() => {
    if (!groupId) {
      return undefined;
    }

    activeGroupIdRef.current = groupId;
    connectSocket();
    const timer = window.setTimeout(() => {
      fetchMessages();
    }, 0);

    if (socket.connected) {
      joinCurrentGroupRoom(groupId).catch((joinError) => {
        console.error("Failed to join group room:", joinError);
        setError(joinError.message || "Failed to connect to live chat.");
      });
    }

    return () => {
      window.clearTimeout(timer);
      clearNotificationTimeouts();
      socket.emit(SOCKET_EVENTS.GROUP_LEAVE, groupId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  useEffect(() => {
    const handleConnect = () => {
      setConnectionState("connected");

      if (activeGroupIdRef.current) {
        joinCurrentGroupRoom(activeGroupIdRef.current).catch((joinError) => {
          console.error("Failed to rejoin group room:", joinError);
          setError(joinError.message || "Failed to reconnect to live chat.");
        });
      }
    };

    const handleDisconnect = () => {
      setConnectionState("disconnected");
    };

    const handleConnectError = (connectError) => {
      console.error("Socket connection error:", connectError);
      setConnectionState("disconnected");
    };

    const handleIncomingChat = (payload) => {
      if (payload?.groupId !== activeGroupIdRef.current || !payload?.chat) {
        return;
      }

      setChats((previousChats) => upsertChat(previousChats, payload.chat));

      if (isOpenRef.current) {
        shouldScrollToBottomRef.current = true;
        return;
      }

      if (!isOwnMessage(payload.chat, currentUserRef.current)) {
        setUnreadCount((previousCount) => previousCount + 1);
        queueNotification(payload.chat);
      }
    };

    const handleUpdatedChat = (payload) => {
      if (payload?.groupId !== activeGroupIdRef.current || !payload?.chat) {
        return;
      }

      setChats((previousChats) => upsertChat(previousChats, payload.chat));
    };

    const handleClearedChat = (payload) => {
      if (payload?.groupId !== activeGroupIdRef.current) {
        return;
      }

      setChats([]);
      setHasMore(false);
      setNextCursor(null);
      setEditingMessageId("");
      setEditingContent("");
      setDeleteTarget(null);
      shouldScrollToBottomRef.current = true;
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on(SOCKET_EVENTS.CHAT_NEW, handleIncomingChat);
    socket.on(SOCKET_EVENTS.CHAT_UPDATED, handleUpdatedChat);
    socket.on(SOCKET_EVENTS.CHAT_DELETED, handleUpdatedChat);
    socket.on(SOCKET_EVENTS.CHAT_CLEARED, handleClearedChat);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off(SOCKET_EVENTS.CHAT_NEW, handleIncomingChat);
      socket.off(SOCKET_EVENTS.CHAT_UPDATED, handleUpdatedChat);
      socket.off(SOCKET_EVENTS.CHAT_DELETED, handleUpdatedChat);
      socket.off(SOCKET_EVENTS.CHAT_CLEARED, handleClearedChat);

      clearNotificationTimeouts();
      disconnectSocket();
    };
  }, []);

  const ConnectionIcon = connectionPill.icon;

  const handleComposerKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleEditingKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSaveEdit();
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-6 sm:right-6">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {notifications.length > 0 && !isOpen && (
          <div className="flex w-full max-w-[calc(100vw-1.5rem)] flex-col items-end gap-2 sm:max-w-80">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={openChat}
                className="w-full rounded-2xl border border-violet-500/20 bg-[#11111a]/95 px-4 py-3 text-left shadow-[0_18px_50px_rgba(7,7,18,0.55)] backdrop-blur-xl transition hover:border-violet-400/30 hover:bg-[#161625]"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/12 text-violet-300">
                    <Bell size={16} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {notification.senderName}
                    </p>

                    <p className="mt-1 max-h-10 overflow-hidden text-xs leading-5 text-gray-400">
                      {notification.preview}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {isOpen && (
          <div className="relative h-[min(76vh,680px)] w-full max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#0b0b12]/95 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:w-[420px]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-violet-500/14 blur-[100px]" />
              <div className="absolute -left-10 bottom-10 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-[90px]" />
            </div>

            <div className="relative flex h-full flex-col">
              <div className="border-b border-white/[0.07] bg-black/10 px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/12 text-violet-300">
                        <MessageCircle size={19} />
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-white sm:text-base">
                          {groupName}
                        </h2>

                        <p className="mt-0.5 text-xs text-gray-500">
                          Real-time group chat
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${connectionPill.className}`}
                      >
                        <ConnectionIcon
                          size={12}
                          className={connectionPill.spin ? "animate-spin" : ""}
                        />
                        {connectionPill.label}
                      </span>

                      {canClearChat && (
                        <span className="rounded-full border border-violet-500/15 bg-violet-500/[0.08] px-2.5 py-1 text-[11px] font-medium text-violet-200">
                          Owner controls enabled
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canClearChat && (
                      <button
                        type="button"
                        onClick={() => {
                          setClearChatOpen(true);
                          setActiveMenuId("");
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/15 bg-red-500/[0.06] text-red-300 transition hover:bg-red-500/[0.12]"
                        title="Clear chat"
                      >
                        <Eraser size={16} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={closeChat}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>
              </div>

              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                <div className="space-y-3">
                  {hasMore && (
                    <div className="flex justify-center pb-1">
                      <button
                        type="button"
                        onClick={handleLoadOlder}
                        disabled={loadingOlder}
                        className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-gray-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingOlder ? (
                          <LoaderCircle size={12} className="animate-spin" />
                        ) : (
                          <ChevronUp size={12} />
                        )}
                        Load earlier messages
                      </button>
                    </div>
                  )}

                  {loading && chats.length === 0 && (
                    <div className="flex h-full min-h-64 items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-500/10 text-violet-300">
                          <LoaderCircle size={18} className="animate-spin" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-gray-300">
                          Loading chat history...
                        </p>
                      </div>
                    </div>
                  )}

                  {!loading && chats.length === 0 && (
                    <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-violet-400/15 bg-violet-500/10 text-violet-300">
                        <MessageCircle size={22} />
                      </div>

                      <h3 className="mt-5 text-base font-semibold text-white">
                        Conversation starts here
                      </h3>

                      <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                        Send a message or share a file activity to kick off this
                        workspace discussion.
                      </p>
                    </div>
                  )}

                  {chats.map((chat, index) => {
                    const ownMessage = isOwnMessage(chat, currentUser);
                    const editableMessage = isEditableMessage(chat, currentUser);
                    const showActions = editableMessage && editingMessageId !== chat._id;
                    const showDateDivider =
                      index === 0 ||
                      formatDateLabel(chats[index - 1].createdAt) !==
                        formatDateLabel(chat.createdAt);

                    if (getChatType(chat) !== "text") {
                      return (
                        <div key={chat._id}>
                          {showDateDivider && (
                            <DateDivider date={chat.createdAt} />
                          )}

                          <SystemMessage chat={chat} />
                        </div>
                      );
                    }

                    return (
                      <div key={chat._id}>
                        {showDateDivider && <DateDivider date={chat.createdAt} />}

                        <div
                          className={`flex gap-3 ${
                            ownMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!ownMessage && <UserAvatar user={chat.sender} size="sm" />}

                          <div
                            className={`group relative max-w-[82%] ${
                              ownMessage ? "items-end" : "items-start"
                            } flex flex-col`}
                          >
                            <div className="mb-1 flex items-center gap-2 px-1">
                              {!ownMessage && (
                                <span className="text-xs font-medium text-violet-200">
                                  {chat.sender?.name || "Member"}
                                </span>
                              )}

                              <span className="text-[10px] uppercase tracking-[0.12em] text-gray-600">
                                {formatTime(chat.createdAt)}
                              </span>

                              {chat.isEdited && !chat.isDeleted && (
                                <span className="text-[10px] uppercase tracking-[0.12em] text-gray-600">
                                  edited
                                </span>
                              )}
                            </div>

                            <div
                              className={`relative rounded-[24px] border px-4 py-3 shadow-[0_14px_40px_rgba(7,7,18,0.25)] ${
                                ownMessage
                                  ? "border-violet-400/15 bg-violet-500/[0.14] text-white"
                                  : "border-white/[0.06] bg-white/[0.035] text-gray-200"
                              }`}
                            >
                              {showActions && (
                                <div className="absolute right-2 top-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveMenuId((previousId) =>
                                        previousId === chat._id ? "" : chat._id
                                      )
                                    }
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-black/20 hover:text-white"
                                  >
                                    <MoreHorizontal size={15} />
                                  </button>

                                  {activeMenuId === chat._id && (
                                    <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151521] p-1 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingMessageId(chat._id);
                                          setEditingContent(chat.content);
                                          setActiveMenuId("");
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-gray-200 transition hover:bg-white/[0.05]"
                                      >
                                        <PencilLine size={14} />
                                        Edit
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDeleteTarget(chat);
                                          setActiveMenuId("");
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-500/[0.08]"
                                      >
                                        <Trash2 size={14} />
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {editingMessageId === chat._id ? (
                                <div className="space-y-3">
                                  <textarea
                                    value={editingContent}
                                    onChange={(event) =>
                                      setEditingContent(
                                        event.target.value.slice(0, CHAT_MAX_LENGTH)
                                      )
                                    }
                                    onKeyDown={handleEditingKeyDown}
                                    rows={3}
                                    className="min-h-[88px] w-full resize-none rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400/35"
                                  />

                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-[11px] text-gray-500">
                                      {editingContent.trim().length}/{CHAT_MAX_LENGTH}
                                    </span>

                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingMessageId("");
                                          setEditingContent("");
                                        }}
                                        className="rounded-full border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
                                      >
                                        Cancel
                                      </button>

                                      <button
                                        type="button"
                                        onClick={handleSaveEdit}
                                        disabled={
                                          !editingContent.trim() ||
                                          submittingAction === "editing"
                                        }
                                        className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {submittingAction === "editing"
                                          ? "Saving..."
                                          : "Save"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p
                                  className={`pr-8 text-sm leading-6 whitespace-pre-wrap break-words ${
                                    chat.isDeleted ? "italic text-gray-500" : ""
                                  }`}
                                >
                                  {chat.isDeleted
                                    ? "This message was deleted"
                                    : chat.content}
                                </p>
                              )}
                            </div>
                          </div>

                          {ownMessage && <UserAvatar user={chat.sender} size="sm" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-white/[0.07] bg-black/15 px-4 py-3 sm:px-5">
                {error && (
                  <div className="mb-3 rounded-2xl border border-red-500/15 bg-red-500/[0.07] px-3 py-2 text-xs text-red-300">
                    {error}
                  </div>
                )}

                <div className="rounded-[26px] border border-white/[0.07] bg-white/[0.03] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <textarea
                    ref={composerRef}
                    value={message}
                    onChange={(event) =>
                      setMessage(event.target.value.slice(0, CHAT_MAX_LENGTH))
                    }
                    onKeyDown={handleComposerKeyDown}
                    rows={1}
                    placeholder="Type a message. Enter to send, Shift+Enter for a new line."
                    className="max-h-36 min-h-[44px] w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-gray-600"
                  />

                  <div className="mt-2 flex items-center justify-between gap-3 px-1">
                    <div className="flex items-center gap-2 text-[11px] text-gray-600">
                      <CornerDownLeft size={12} />
                      Enter sends
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-gray-600">
                        {message.trim().length}/{CHAT_MAX_LENGTH}
                      </span>

                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sending}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-[0_12px_28px_rgba(124,58,237,0.28)] transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {sending ? (
                          <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {(deleteTarget || clearChatOpen) && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
                <div className="w-full max-w-sm rounded-[28px] border border-white/[0.08] bg-[#11111a] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
                  {deleteTarget ? (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/[0.08] text-red-300">
                        <Trash2 size={18} />
                      </div>

                      <h3 className="mt-4 text-lg font-semibold text-white">
                        Delete message?
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-gray-400">
                        This keeps the conversation position but replaces the
                        content with a deleted state for everyone in the group.
                      </p>

                      <div className="mt-5 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(null)}
                          className="rounded-full border border-white/[0.08] px-4 py-2 text-sm font-medium text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={handleDeleteMessage}
                          disabled={submittingAction === "deleting"}
                          className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {submittingAction === "deleting" ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/[0.08] text-red-300">
                        <Eraser size={18} />
                      </div>

                      <h3 className="mt-4 text-lg font-semibold text-white">
                        Clear this group chat?
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-gray-400">
                        This will permanently remove this group&apos;s chat history
                        for every member currently in the workspace.
                      </p>

                      <div className="mt-5 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setClearChatOpen(false)}
                          className="rounded-full border border-white/[0.08] px-4 py-2 text-sm font-medium text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={handleClearChat}
                          disabled={submittingAction === "clearing"}
                          className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {submittingAction === "clearing"
                            ? "Clearing..."
                            : "Clear chat"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              closeChat();
            } else {
              openChat();
            }
          }}
          className="relative inline-flex h-[60px] w-[60px] items-center justify-center rounded-[24px] border border-violet-400/20 bg-violet-600 text-white shadow-[0_22px_60px_rgba(124,58,237,0.36)] transition hover:-translate-y-1 hover:bg-violet-500"
        >
          {unreadCount > 0 && !isOpen && (
            <div className="absolute -right-1.5 -top-1.5 flex min-h-7 min-w-7 items-center justify-center rounded-full border border-[#0b0b12] bg-red-500 px-2 text-[11px] font-semibold text-white">
              {formatUnreadCount(unreadCount)}
            </div>
          )}

          {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
        </button>
      </div>
    </div>
  );
}

function DateDivider({ date }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-white/[0.05]" />
      <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
        {formatDateLabel(date)}
      </span>
      <div className="h-px flex-1 bg-white/[0.05]" />
    </div>
  );
}

function SystemMessage({ chat }) {
  const icon =
    getChatType(chat) === "file_delete" ? (
      <Trash2 size={14} />
    ) : getChatType(chat) === "file_upload" ? (
      <FileUp size={14} />
    ) : (
      <FileUp size={14} />
    );

  return (
    <div className="flex justify-center">
      <div className="inline-flex max-w-[92%] items-center gap-2 rounded-full border border-violet-400/12 bg-violet-500/[0.08] px-4 py-2 text-center text-xs leading-5 text-violet-100">
        <span className="text-violet-300">{icon}</span>
        <span className="break-words">{chat.content}</span>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";

const JoinGroupModal = ({ onClose, onJoined }) => {
    const [joinCode, setJoinCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        if (joinCode.trim().length !== 6) {
            setMessage("Enter a valid 6-character group code.");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            const token = localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/groups/join",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        joinCode: joinCode.trim(),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(
                    data.message || "Failed to join group."
                );
                return;
            }

            setJoinCode("");

            if (onJoined) {
                onJoined(data);
            }

            onClose();

        } catch (error) {
            console.error(error);
            setMessage("Something went wrong!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="
                fixed
                inset-0
                z-[100]
                flex
                items-center
                justify-center
                bg-black/70
                p-4
                backdrop-blur-sm
            "
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="
                    relative
                    w-full
                    max-w-[430px]
                    overflow-hidden
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#17131f]
                    shadow-2xl
                    shadow-violet-950/40
                "
            >
                {/* CLOSE */}

                <button
                    type="button"
                    onClick={onClose}
                    className="
                        absolute
                        right-4
                        top-4
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-full
                        bg-white/5
                        text-lg
                        text-white/50
                        transition
                        hover:bg-white/10
                        hover:text-white
                    "
                >
                    ×
                </button>

                <div className="p-7 sm:p-9">

                    {/* HEADER */}

                    <div className="pr-10">
                        <p
                            className="
                                text-xs
                                font-medium
                                uppercase
                                tracking-[0.18em]
                                text-[#9b7cff]
                            "
                        >
                            Join workspace
                        </p>

                        <h2
                            className="
                                mt-3
                                text-2xl
                                font-semibold
                                tracking-tight
                                text-white
                            "
                        >
                            Join a group
                        </h2>

                        <p
                            className="
                                mt-2
                                text-sm
                                leading-6
                                text-[#91899d]
                            "
                        >
                            Enter the 6-character code shared
                            with you by the group owner.
                        </p>
                    </div>

                    {/* MESSAGE */}

                    {message && (
                        <div
                            className="
                                mt-5
                                rounded-lg
                                border
                                border-red-500/20
                                bg-red-500/10
                                px-4
                                py-3
                                text-sm
                                text-red-300
                            "
                        >
                            {message}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="mt-7"
                    >
                        <label
                            className="
                                mb-2
                                block
                                text-xs
                                font-medium
                                text-[#aaa2b5]
                            "
                        >
                            Group code
                        </label>

                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) =>
                                setJoinCode(
                                    e.target.value
                                        .toUpperCase()
                                        .replace(
                                            /[^A-Z0-9]/g,
                                            ""
                                        )
                                )
                            }
                            maxLength={6}
                            placeholder="ABC123"
                            autoFocus
                            required
                            className="
                                w-full
                                rounded-lg
                                border
                                border-transparent
                                bg-[#3b3449]
                                px-5
                                py-4
                                text-center
                                text-xl
                                font-semibold
                                uppercase
                                tracking-[0.35em]
                                text-white
                                outline-none
                                transition
                                placeholder:text-[#756e80]
                                focus:border-[#8b6cff]
                                focus:ring-1
                                focus:ring-[#8b6cff]
                            "
                        />

                        <div
                            className="
                                mt-6
                                flex
                                items-center
                                justify-end
                                gap-3
                            "
                        >
                            <button
                                type="button"
                                onClick={onClose}
                                className="
                                    rounded-lg
                                    border
                                    border-white/10
                                    bg-white/5
                                    px-5
                                    py-3
                                    text-sm
                                    font-medium
                                    text-white/70
                                    transition
                                    hover:bg-white/10
                                    hover:text-white
                                "
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="
                                    rounded-lg
                                    bg-[#7656d1]
                                    px-5
                                    py-3
                                    text-sm
                                    font-medium
                                    text-white
                                    transition
                                    hover:bg-[#8565df]
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                {loading
                                    ? "Joining..."
                                    : "Join Group"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JoinGroupModal;
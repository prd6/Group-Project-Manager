import { useEffect, useState } from "react";
import API from "../services/api";

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

            const { data } = await API.post("/groups/join", {
                joinCode: joinCode.trim(),
            });

            setJoinCode("");

            if (onJoined) {
                onJoined(data);
            }

            onClose();

        } catch (error) {
            console.error(error);

            setMessage(
                error.response?.data?.message ||
                error.message ||
                "Something went wrong!"
            );
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
                    border-[#222]
                    bg-[#121212]
                    shadow-2xl
                    shadow-black/40
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
                        bg-[#1b1b1b]
                        text-lg
                        text-gray-500
                        transition
                        hover:bg-[#222]
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
                                text-gray-500
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
                                text-gray-400
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
                                text-gray-500
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
                            spellCheck={false}
                            autoComplete="off"
                            placeholder="ABC123"
                            autoFocus
                            required
                            className="
                                w-full
                                rounded-lg
                                border
                                border-transparent
                                bg-black/20
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
                                placeholder:text-gray-600
                                focus:border-white/20
                                focus:ring-1
                                focus:ring-0
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
                                    border-[#222]
                                    bg-[#1b1b1b]
                                    px-5
                                    py-3
                                    text-sm
                                    font-medium
                                    text-gray-300
                                    transition
                                    hover:bg-[#222]
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
                                    bg-white
                                    px-5
                                    py-3
                                    text-sm
                                    font-medium
                                    text-black
                                    transition
                                    hover:bg-gray-200
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

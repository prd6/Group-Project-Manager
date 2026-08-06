import { useEffect, useState } from "react";
import API from "../services/api";

const CreateGroupModal = ({ onClose, onCreated }) => {
    const [groupData, setGroupData] = useState({
        groupName: "",
        projectName: "",
        description: "",
        deadline: "",
        maxMembers: 4,
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Close with Escape
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

    const handleChange = (e) => {
        const { name, value } = e.target;

        setGroupData((prev) => ({
            ...prev,
            [name]:
                name === "maxMembers"
                    ? Number(value)
                    : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        try {
            setLoading(true);
            setMessage("");


            const { data } = await API.post(
                "/groups/create",
                groupData
            );

            setGroupData({
                groupName: "",
                projectName: "",
                description: "",
                deadline: "",
                maxMembers: 4,
            });

            // Let Dashboard refresh its groups
            if (onCreated) {
                onCreated(data);
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
                    max-w-[560px]
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
                            New workspace
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
                            Create a group
                        </h2>

                        <p
                            className="
                                mt-2
                                text-sm
                                leading-6
                                text-gray-400
                            "
                        >
                            Start a project workspace and invite
                            your teammates to collaborate.
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

                    {/* FORM */}

                    <form
                        onSubmit={handleSubmit}
                        className="mt-7 space-y-4"
                    >
                        {/* GROUP NAME */}

                        <div>
                            <label
                                className="
                                    mb-2
                                    block
                                    text-xs
                                    font-medium
                                    text-gray-500
                                "
                            >
                                Group name *
                            </label>

                            <input
                                type="text"
                                name="groupName"
                                value={groupData.groupName}
                                onChange={handleChange}
                                placeholder="e.g. CodeGPM Team"
                                required
                                autoFocus
                                className="
                                    w-full
                                    rounded-lg
                                    border
                                    border-transparent
                                    bg-black/20
                                    px-4
                                    py-3.5
                                    text-sm
                                    text-white
                                    outline-none
                                    transition
                                    placeholder:text-gray-600
                                    focus:border-white/20
                                    focus:ring-1
                                    focus:ring-0
                                "
                            />
                        </div>

                        {/* PROJECT NAME */}

                        <div>
                            <label
                                className="
                                    mb-2
                                    block
                                    text-xs
                                    font-medium
                                    text-gray-500
                                "
                            >
                                Project name
                            </label>

                            <input
                                type="text"
                                name="projectName"
                                value={groupData.projectName}
                                onChange={handleChange}
                                placeholder="e.g. Group Project Manager"
                                className="
                                    w-full
                                    rounded-lg
                                    border
                                    border-transparent
                                    bg-black/20
                                    px-4
                                    py-3.5
                                    text-sm
                                    text-white
                                    outline-none
                                    transition
                                    placeholder:text-gray-600
                                    focus:border-white/20
                                    focus:ring-1
                                    focus:ring-0
                                "
                            />
                        </div>

                        {/* DESCRIPTION */}

                        <div>
                            <label
                                className="
                                    mb-2
                                    block
                                    text-xs
                                    font-medium
                                    text-gray-500
                                "
                            >
                                Description
                            </label>

                            <textarea
                                rows={4}
                                name="description"
                                value={groupData.description}
                                onChange={handleChange}
                                placeholder="What are you building?"
                                className="
                                    w-full
                                    resize-none
                                    rounded-lg
                                    border
                                    border-transparent
                                    bg-black/20
                                    px-4
                                    py-3.5
                                    text-sm
                                    leading-6
                                    text-white
                                    outline-none
                                    transition
                                    placeholder:text-gray-600
                                    focus:border-white/20
                                    focus:ring-1
                                    focus:ring-0
                                "
                            />
                        </div>

                        {/* DEADLINE */}

                        <div>
                            <label
                                className="
                                    mb-2
                                    block
                                    text-xs
                                    font-medium
                                    text-gray-500
                                "
                            >
                                Deadline
                            </label>

                            <input
                                type="date"
                                name="deadline"
                                value={groupData.deadline}
                                onChange={handleChange}
                                className="
                                    w-full
                                    rounded-lg
                                    border
                                    border-transparent
                                    bg-black/20
                                    px-4
                                    py-3.5
                                    text-sm
                                    text-white
                                    outline-none
                                    transition
                                    focus:border-white/20
                                    focus:ring-1
                                    focus:ring-0
                                "
                            />
                        </div>

                        {/* MAXIMUM MEMBERS */}

                        <div>
                            <label
                                className="
            mb-2
            block
            text-xs
            font-medium
            text-gray-500
        "
                            >
                                Maximum Members
                            </label>

                            <select
                                name="maxMembers"
                                value={groupData.maxMembers}
                                onChange={handleChange}
                                className="
            w-full
            rounded-lg
            border
            border-transparent
            bg-black/20
            px-4
            py-3.5
            text-sm
            text-white
            outline-none
            transition
            focus:border-white/20
            focus:ring-1
            focus:ring-0
        "
                            >
                                <option value={4}>4 Members</option>
                                <option value={6}>6 Members</option>
                                <option value={12}>12 Members</option>
                            </select>
                        </div>

                        {/* ACTIONS */}

                        <div
                            className="
                                flex
                                items-center
                                justify-end
                                gap-3
                                pt-3
                            "
                        >
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
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
                                    ? "Creating..."
                                    : "Create Group"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;

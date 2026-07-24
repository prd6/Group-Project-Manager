import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FileManager from "../Components/FileManager";
import UserAvatar from "../Components/UserAvatar";

const Workspace = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();

    const [group, setGroup] = useState(null);

    // =========================
    // FETCH GROUP DETAILS
    // =========================

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await fetch(
                    `http://localhost:5000/api/groups/${groupId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (response.ok) {
                    setGroup(data);
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error("Failed to fetch group:", error);
            }
        };

        if (groupId) {
            fetchGroup();
        }
    }, [groupId]);

    // =========================
    // LOADING
    // =========================

    if (!group) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <h1 className="text-2xl font-bold">
                    Loading...
                </h1>
            </div>
        );
    }

    const owner = group.members?.find(
        (member) => member.role === "Owner"
    )?.user;

    return (
        <div className="min-h-screen bg-gray-100">

            {/* =========================
                HEADER
            ========================== */}

            <div className="bg-blue-600 text-white p-5 shadow">

                <h1 className="text-3xl font-bold">
                    Project Workspace
                </h1>

                <p className="text-sm mt-1">
                    Manage your project and collaborate with your teammates.
                </p>

            </div>


            <div className="max-w-6xl mx-auto p-6">

                {/* =========================
                    PROJECT DETAILS
                ========================== */}

                <div className="bg-white rounded-lg shadow p-6 mb-6">

                    <h2 className="text-2xl font-bold mb-4">
                        {group.projectName || "No Project Name"}
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">

                        {/* Group Name */}

                        <div>
                            <p className="font-semibold">
                                Group Name
                            </p>

                            <p>
                                {group.groupName}
                            </p>
                        </div>


                        {/* Join Code */}

                        <div>
                            <p className="font-semibold">
                                Join Code
                            </p>

                            <p>
                                {group.joinCode}
                            </p>
                        </div>


                        {/* Owner */}

                        <div>
                            <p className="font-semibold">
                                Owner
                            </p>

                            <div className="mt-2 flex items-center gap-2">

                                <UserAvatar
                                    user={owner}
                                    size="sm"
                                />

                                <p>
                                    {owner?.name || "Unknown"}
                                </p>

                            </div>
                        </div>


                        {/* Deadline */}

                        <div>
                            <p className="font-semibold">
                                Deadline
                            </p>

                            <p>
                                {group.deadline
                                    ? new Date(
                                          group.deadline
                                      ).toLocaleDateString()
                                    : "No Deadline"}
                            </p>
                        </div>

                    </div>


                    {/* Description */}

                    <div className="mt-5">

                        <p className="font-semibold">
                            Description
                        </p>

                        <p className="text-gray-600 mt-2">
                            {group.description ||
                                "No description added."}
                        </p>

                    </div>

                </div>


                {/* =========================
                    MEMBERS
                ========================== */}

                <div className="bg-white rounded-lg shadow p-6 mb-6">

                    <h2 className="text-xl font-bold mb-4">
                        Members
                    </h2>

                    <ul className="space-y-3">

                        {group.members
                            ?.filter((member) => member.user)
                            .map((member) => (

                                <li
                                    key={member.user._id}
                                    className="
                                        border
                                        rounded
                                        p-3
                                        flex
                                        justify-between
                                        items-center
                                        gap-3
                                    "
                                >

                                    {/* User */}

                                    <div className="flex min-w-0 items-center gap-3">

                                        <UserAvatar
                                            user={member.user}
                                            size="sm"
                                        />

                                        <span className="truncate">
                                            {member.user.name}
                                        </span>

                                    </div>


                                    {/* Role */}

                                    <span
                                        className={
                                            member.role === "Owner"
                                                ? "text-blue-600 font-semibold"
                                                : ""
                                        }
                                    >
                                        {member.role}
                                    </span>

                                </li>

                            ))}

                    </ul>

                </div>


                {/* =========================
                    PROJECT FEATURES
                ========================== */}

                <div className="bg-white rounded-lg shadow p-6">

                    <h2 className="text-xl font-bold mb-5">
                        Project Features
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6 items-start">

                        {/* =========================
                            FILE UPLOAD
                        ========================== */}

                        <div>
                            <FileManager groupId={group._id} />
                        </div>


                        {/* =========================
                            FEATURE BUTTONS
                        ========================== */}

                        <div className="grid grid-cols-2 gap-4 mt-20">

                            {/* View Files */}

                            <button
                                onClick={() =>
                                    navigate(
                                        `/workspace/${groupId}/files`
                                    )
                                }
                                className="
                                    bg-green-500
                                    hover:bg-green-600
                                    text-white
                                    py-6
                                    rounded-lg
                                    font-semibold
                                    transition
                                "
                            >
                                📁 View Files
                            </button>


                            {/* Version History */}

                            <button
                                className="
                                    bg-purple-500
                                    hover:bg-purple-600
                                    text-white
                                    py-6
                                    rounded-lg
                                    font-semibold
                                    transition
                                "
                            >
                                🕘 Version History
                            </button>


                            {/* Code Showcase */}

                            <button
                                className="
                                    bg-orange-500
                                    hover:bg-orange-600
                                    text-white
                                    py-6
                                    rounded-lg
                                    font-semibold
                                    transition
                                "
                            >
                                💻 Code Showcase
                            </button>


                            {/* Publish */}

                            <button
                                className="
                                    bg-indigo-500
                                    hover:bg-indigo-600
                                    text-white
                                    py-6
                                    rounded-lg
                                    font-semibold
                                    transition
                                "
                            >
                                🚀 Publish Project
                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default Workspace;
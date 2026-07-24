import { useEffect, useState } from "react";
import AdminAPI from "../services/admin";
import UserAvatar from "../Components/UserAvatar";

function Groups() {
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await AdminAPI.get("/groups", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setGroups(res.data.groups);
            } catch (error) {
                console.log(error);
            }
        };
        fetchGroups();
    }, []);

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this group?"
        );

        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem("token");

            await AdminAPI.delete(`/groups/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setGroups(groups.filter((group) => group._id !== id));
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-4xl font-bold text-violet-700 mb-8">
                Manage Groups
            </h1>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-violet-600 text-white">
                        <tr>
                            <th className="p-4 text-left">Group Name</th>
                            <th className="p-4 text-left">Group Key</th>
                            <th className="p-4 text-left">Owner</th>
                            <th className="p-4 text-center">Members</th>
                            <th className="p-4 text-left">Created</th>
                            <th className="p-4 text-center">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {groups.map((group) => (
                            <tr
                                key={group._id}
                                className="border-b hover:bg-gray-50"
                            >
                                <td className="p-4 font-medium">
                                    {group.groupName}
                                </td>

                                <td className="p-4">
                                    {group.joinCode}
                                </td>

                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <UserAvatar
                                            user={group.members?.find(m => m.role === "Owner")?.user}
                                            size="sm"
                                        />
                                        <span>
                                            {group.members?.find(m => m.role === "Owner")?.user?.name || "Unknown"}
                                        </span>
                                    </div>
                                </td>

                                <td className="p-4 text-center">
                                    {group.members?.length || 0}
                                </td>

                                <td className="p-4">
                                    {new Date(group.createdAt).toLocaleDateString()}
                                </td>

                                <td className="p-4">
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => handleDelete(group._id)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {groups.length === 0 && (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="text-center p-6 text-gray-500"
                                >
                                    No groups found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Groups;

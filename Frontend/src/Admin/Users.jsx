import { useEffect, useState } from "react";
import AdminAPI from "../services/admin";

function Users() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        role: "",
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await AdminAPI.get("/users", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setUsers(res.data.users);
            } catch (err) {
                console.log(err);
            }
        };

        fetchUsers();
    }, []);

    const handleEdit = (user) => {
        setSelectedUser(user);

        setEditForm({
            name: user.name,
            email: user.email,
            role: user.role,
        });
    };

    const saveUser = async () => {
        try {
            const token = localStorage.getItem("token");

            await AdminAPI.put(
                `/users/${selectedUser._id}`,
                editForm,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setUsers(
                users.map((u) =>
                    u._id === selectedUser._id
                        ? { ...u, ...editForm }
                        : u
                )
            );

            setSelectedUser(null);
        } catch (err) {
            console.log(err);
        }
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this user?"
        );

        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem("token");

            await AdminAPI.delete(`/users/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setUsers(users.filter((user) => user._id !== id));
        } catch (err) {
            console.log(err);
        }
    };

    const handleBan = async (id) => {
        try {
            const token = localStorage.getItem("token");

            await AdminAPI.put(
                `/users/${id}/ban`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setUsers((prev) =>
                prev.map((u) =>
                    u._id === id
                        ? { ...u, isBanned: !u.isBanned }
                        : u
                )
            );
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-4xl font-bold text-violet-700 mb-8">
                Manage Users
            </h1>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-violet-600 text-white">
                        <tr>
                            <th className="p-4 text-left">Name</th>
                            <th className="p-4 text-left">Email</th>
                            <th className="p-4 text-left">Role</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {users.map((user) => (
                            <tr key={user._id} className="border-b hover:bg-gray-50">
                                <td className="p-4">{user.name}</td>
                                <td className="p-4">{user.email}</td>
                                <td className="p-4 capitalize">{user.role}</td>

                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => handleDelete(user._id)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                        >
                                            Delete
                                        </button>

                                        <button
                                            onClick={() => handleBan(user._id)}
                                            className={`px-3 py-1 rounded text-white ${
                                                user.isBanned
                                                    ? "bg-green-600 hover:bg-green-700"
                                                    : "bg-orange-500 hover:bg-orange-600"
                                            }`}
                                        >
                                            {user.isBanned ? "Unban" : "Ban"}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {users.length === 0 && (
                            <tr>
                                <td
                                    colSpan="4"
                                    className="text-center p-6 text-gray-500"
                                >
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit User Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-96">
                        <h2 className="text-2xl font-bold mb-4 text-violet-700">
                            Edit User
                        </h2>

                        <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    name: e.target.value,
                                })
                            }
                            placeholder="Name"
                            className="w-full border rounded p-2 mb-3"
                        />

                        <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    email: e.target.value,
                                })
                            }
                            placeholder="Email"
                            className="w-full border rounded p-2 mb-3"
                        />

                        <select
                            value={editForm.role}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    role: e.target.value,
                                })
                            }
                            className="w-full border rounded p-2 mb-5"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={saveUser}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Users;
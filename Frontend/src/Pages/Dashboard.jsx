import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../Components/DashboardNavbar";

const Dashboard = () => {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch user's groups
  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/groups/my-groups",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setGroups(data);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete group
  const deleteGroup = async (groupId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this group?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(groupId);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/groups/${groupId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setGroups((prevGroups) =>
          prevGroups.filter(
            (group) => group._id !== groupId
          )
        );
      } else {
        console.error(data.message);
        alert(data.message || "Failed to delete group");
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
      alert("Something went wrong while deleting the group.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="min-h-screen bg-[#08080d] text-white">

      <DashboardNavbar />

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">

        {/* Header */}
        <section className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back 👋
            </h1>

            <p className="mt-2 text-gray-500">
              Pick up where you left off.
            </p>
          </div>

          <div className="flex gap-3">

            <button
              onClick={() => navigate("/Create_Grp")}
              className="
                    rounded-xl
                    bg-violet-600
                    px-5 py-2.5
                    text-sm font-medium
                    transition
                    hover:bg-violet-500
                "
            >
              + Create Group
            </button>

            <button
              onClick={() => navigate("/Join_Grp")}
              className="
                    rounded-xl
                    border border-white/10
                    bg-white/[0.04]
                    px-5 py-2.5
                    text-sm font-medium
                    text-gray-300
                    transition
                    hover:bg-white/[0.08]
                    hover:text-white
                "
            >
              Join Group
            </button>

          </div>

        </section>


        {/* Groups Header */}
        <section>

          <div className="mb-6 flex items-end justify-between">

            <div>
              <h2 className="text-xl font-semibold">
                Your Groups
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {loading
                  ? "Loading your groups..."
                  : `${groups.length} ${groups.length === 1 ? "group" : "groups"
                  }`}
              </p>
            </div>

          </div>


          {/* Loading */}
          {loading ? (

            <div className="flex min-h-[250px] items-center justify-center">

              <div
                className="
                        h-7 w-7
                        animate-spin
                        rounded-full
                        border-2
                        border-white/10
                        border-t-violet-500
                    "
              />

            </div>

          ) : groups.length === 0 ? (

            /* Empty State */
            <div
              className="
                    flex min-h-[300px]
                    flex-col
                    items-center
                    justify-center
                    rounded-2xl
                    border border-dashed border-white/10
                    bg-white/[0.02]
                    px-6
                    text-center
                "
            >

              <div
                className="
                        mb-4
                        flex h-12 w-12
                        items-center justify-center
                        rounded-xl
                        bg-violet-500/10
                        text-xl text-violet-400
                    "
              >
                +
              </div>

              <h3 className="font-medium">
                No groups yet
              </h3>

              <p className="mt-2 max-w-sm text-sm text-gray-500">
                Create a new group for your project or join
                an existing one using a join code.
              </p>

              <button
                onClick={() => navigate("/Create_Grp")}
                className="mt-5 text-sm font-medium text-violet-400 hover:text-violet-300"
              >
                Create your first group →
              </button>

            </div>

          ) : (

            /* Groups Grid */
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

              {groups.map((group) => (

                <article
                  key={group._id}
                  className="
                            rounded-2xl
                            border border-white/[0.08]
                            bg-[#0d0d13]
                            p-5
                            transition-all
                            duration-200
                            hover:border-white/[0.15]
                        "
                >

                  {/* Group Info */}
                  <div className="flex items-start gap-4">

                    {/* Group Letter */}
                    <div
                      className="
                                    flex h-11 w-11
                                    shrink-0
                                    items-center justify-center
                                    rounded-xl
                                    bg-violet-500/10
                                    font-semibold
                                    text-violet-400
                                "
                    >
                      {group.groupName
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>


                    <div className="min-w-0 flex-1">

                      <div className="flex items-center justify-between gap-2">

                        <h3 className="truncate text-lg font-semibold">
                          {group.groupName}
                        </h3>

                        {/* Role */}
                        <span
                          className="
                                            shrink-0
                                            rounded-md
                                            bg-white/[0.05]
                                            px-2 py-1
                                            text-[10px]
                                            font-medium
                                            uppercase
                                            tracking-wider
                                            text-gray-500
                                        "
                        >
                          {group.myRole}
                        </span>

                      </div>

                      <p className="mt-1 truncate text-sm text-gray-500">
                        {group.projectName || "No project name"}
                      </p>

                    </div>

                  </div>


                  {/* Description */}
                  {group.description && (

                    <p className="mt-5 line-clamp-2 text-sm leading-6 text-gray-400">
                      {group.description}
                    </p>

                  )}


                  {/* Join Code */}
                  <div
                    className="
                                mt-5
                                rounded-xl
                                border border-white/[0.06]
                                bg-black/20
                                px-4 py-3
                            "
                  >

                    <p className="text-[10px] uppercase tracking-widest text-gray-600">
                      Join Code
                    </p>

                    <p className="mt-1 font-mono text-sm tracking-wider text-gray-300">
                      {group.joinCode}
                    </p>

                  </div>


                  {/* Actions */}
                  <div className="mt-5 flex items-center justify-end gap-2">

                    {/* Delete - Owner only */}
                    {group.myRole === "Owner" && (

                      <button
                        onClick={() =>
                          deleteGroup(group._id)
                        }
                        disabled={
                          deletingId === group._id
                        }
                        className="
                                        rounded-lg
                                        px-3 py-2
                                        text-sm
                                        text-gray-500
                                        transition
                                        hover:bg-red-500/10
                                        hover:text-red-400
                                        disabled:opacity-40
                                    "
                      >
                        {deletingId === group._id
                          ? "Deleting..."
                          : "Delete"}
                      </button>

                    )}


                    {/* Open */}
                    <button
                      onClick={() =>
                        navigate(
                          `/workspace/${group._id}`
                        )
                      }
                      className="
                                    rounded-lg
                                    bg-white
                                    px-4 py-2
                                    text-sm
                                    font-medium
                                    text-black
                                    transition
                                    hover:bg-gray-200
                                "
                    >
                      Open
                    </button>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

      </main>
    </div>
  );
};

export default Dashboard;
import { useState } from "react";

const Create_Grp = () => {
  const [groupData, setGroupData] = useState({
    groupName: "",
    projectName: "",
    description: "",
    deadline: "",
  });

  const handleChange = (e) => {
    setGroupData({
      ...groupData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log(groupData);

    // API call here
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-5">

      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-center text-blue-600">
          Create New Group
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-8">
          Create a group and invite your teammates.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Group Name */}

          <div>
            <label className="block mb-2 font-medium">
              Group Name *
            </label>

            <input
              type="text"
              name="groupName"
              placeholder="Enter group name"
              value={groupData.groupName}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Project Name */}

          <div>
            <label className="block mb-2 font-medium">
              Project Name
            </label>

            <input
              type="text"
              name="projectName"
              placeholder="Enter project name"
              value={groupData.projectName}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}

          <div>
            <label className="block mb-2 font-medium">
              Description
            </label>

            <textarea
              rows="4"
              name="description"
              placeholder="Write something about the project..."
              value={groupData.description}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          {/* Deadline */}

          <div>
            <label className="block mb-2 font-medium">
              Deadline
            </label>

            <input
              type="date"
              name="deadline"
              value={groupData.deadline}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}

          <div className="flex justify-end gap-4 pt-4">

            <button
              type="button"
              className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Create Group
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default Create_Grp;
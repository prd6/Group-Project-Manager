function Admin() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-violet-700 mb-8">
        Admin Dashboard
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Total Users</h2>
          <p className="text-3xl font-bold mt-2">120</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Groups</h2>
          <p className="text-3xl font-bold mt-2">18</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Files</h2>
          <p className="text-3xl font-bold mt-2">356</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Tasks</h2>
          <p className="text-3xl font-bold mt-2">72</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700">
            Manage Users
          </button>

          <button className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
            Manage Groups
          </button>

          <button className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700">
            View Files
          </button>

          <button className="bg-red-600 text-white py-3 rounded-lg hover:bg-red-700">
            Reports
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-semibold mb-6">Recent Activity</h2>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">User</th>
              <th className="text-left py-3">Action</th>
              <th className="text-left py-3">Time</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-b">
              <td className="py-3">Priyangshu</td>
              <td>Created Group</td>
              <td>2 mins ago</td>
            </tr>

            <tr className="border-b">
              <td className="py-3">Rahul</td>
              <td>Uploaded Project.pdf</td>
              <td>10 mins ago</td>
            </tr>

            <tr>
              <td className="py-3">Ankit</td>
              <td>Joined Group</td>
              <td>25 mins ago</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Admin;
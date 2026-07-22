import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Join_Grp = () => {
  const [joinCode, setJoinCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
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
            joinCode,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Joined Successfully!");

        // Clear the input
        setJoinCode("");

        // Redirect to Dashboard
        navigate("/dashboard");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-5">

      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">

        <h1 className="text-3xl font-bold text-center text-blue-600">
          Join Group
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-8">
          Enter the group code shared by the group owner.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="font-medium mb-2 flex justify-center">
              Group Code
            </label>

            <input
              type="text"
              placeholder="Enter Group Code Here"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              required
              className="w-full border rounded-lg p-3 text-center text-xl font-semibold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-between">

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2 border rounded-lg hover:bg-gray-100"
            >
              Back
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Join Group
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default Join_Grp;
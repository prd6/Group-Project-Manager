import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Loader2, Save, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../Components/DashboardNavbar";
import UserAvatar from "../Components/UserAvatar";
import { API_ORIGIN } from "../services/apiConfig";

const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxFileSize = 2 * 1024 * 1024;

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingPicture, setRemovingPicture] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const previewUser = useMemo(
    () => ({
      ...user,
      profilePicture: previewUrl || user?.profilePicture || "",
    }),
    [previewUrl, user]
  );

  const syncUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    setName(updatedUser.name || "");
    localStorage.setItem("user", JSON.stringify(updatedUser));
    window.dispatchEvent(new CustomEvent("user-updated", { detail: updatedUser }));
  }, []);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const handleAuthFailure = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          handleAuthFailure();
          return;
        }

        const response = await fetch(`${API_ORIGIN}/api/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.status === 401) {
          handleAuthFailure();
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to load profile");
        }

        syncUser(data.user);
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [handleAuthFailure, syncUser]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const setFeedback = (successMessage) => {
    setMessage(successMessage);
    setError("");
  };

  const setFailure = (failureMessage) => {
    setError(failureMessage);
    setMessage("");
  };

  const chooseImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!supportedTypes.includes(file.type)) {
      setFailure("Choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > maxFileSize) {
      setFailure("Profile picture must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMessage("");
    setError("");
  };

  const cancelImageSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadProfilePicture = async () => {
    if (!selectedFile || uploading) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("profilePicture", selectedFile);

      const response = await fetch(`${API_ORIGIN}/api/users/profile-picture`, {
        method: "PATCH",
        headers: authHeaders(),
        body: formData,
      });

      const data = await response.json();

      if (response.status === 401) {
        handleAuthFailure();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload profile picture");
      }

      syncUser(data.user);
      cancelImageSelection();
      setFeedback("Profile picture updated.");
    } catch (err) {
      setFailure(err.message || "Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  const removeProfilePicture = async () => {
    if (removingPicture || !user?.profilePicture) return;

    try {
      setRemovingPicture(true);

      const response = await fetch(`${API_ORIGIN}/api/users/profile-picture`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await response.json();

      if (response.status === 401) {
        handleAuthFailure();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove profile picture");
      }

      syncUser(data.user);
      cancelImageSelection();
      setFeedback("Profile picture removed.");
    } catch (err) {
      setFailure(err.message || "Failed to remove profile picture");
    } finally {
      setRemovingPicture(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim().replace(/\s+/g, " ");

    if (trimmedName.length < 2) {
      setFailure("Name must be at least 2 characters.");
      return;
    }

    try {
      setSavingProfile(true);

      const response = await fetch(`${API_ORIGIN}/api/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      const data = await response.json();

      if (response.status === 401) {
        handleAuthFailure();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      syncUser(data.user);
      setFeedback("Profile updated.");
    } catch (err) {
      setFailure(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Unknown";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080d] text-white">
        <DashboardNavbar fetchProfile={false} />
        <main className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-5">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
        </main>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-[#08080d] text-white">
        <DashboardNavbar fetchProfile={false} />
        <main className="mx-auto max-w-3xl px-5 py-16">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
            {error}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080d] text-white">
      <DashboardNavbar fetchProfile={false} />

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
        <section className="rounded-3xl border border-violet-400/10 bg-white/[0.04] p-6 shadow-[0_0_50px_rgba(139,92,246,0.08)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={chooseImage}
                className="group relative rounded-full"
                aria-label="Choose profile picture"
              >
                <UserAvatar
                  user={previewUser}
                  size="xl"
                  className="ring-4 ring-violet-500/20 transition group-hover:ring-violet-400/40"
                />
                <span className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border border-violet-300/40 bg-[#16121f] text-violet-200 shadow-lg">
                  <Camera size={18} />
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={chooseImage}
                className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-500/20"
              >
                Choose Image
              </button>
            </div>

            <div className="min-w-0 flex-1 text-center md:text-left">
              <p className="text-sm font-medium uppercase tracking-widest text-violet-300/80">
                Profile
              </p>
              <h1 className="mt-3 break-words text-3xl font-bold sm:text-4xl">
                {user.name}
              </h1>
              <p className="mt-2 break-all text-gray-400">{user.email}</p>
              <p className="mt-4 text-sm text-gray-500">Joined {joinedDate}</p>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-white">Preview ready</p>
                  <p className="mt-1 break-all text-sm text-gray-500">
                    {selectedFile.name}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={uploadProfilePicture}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                  >
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {uploading ? "Uploading..." : "Save Image"}
                  </button>

                  <button
                    type="button"
                    onClick={cancelImageSelection}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/[0.08] disabled:opacity-50"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {!selectedFile && user.profilePicture && (
            <button
              type="button"
              onClick={removeProfilePicture}
              disabled={removingPicture}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              {removingPicture ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {removingPicture ? "Removing..." : "Remove Picture"}
            </button>
          )}

          {(message || error) && (
            <div
              className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
                error
                  ? "border-red-400/20 bg-red-500/10 text-red-100"
                  : "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
              }`}
            >
              {error || message}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl sm:p-8">
          <h2 className="text-xl font-semibold">Edit Profile</h2>
          <form onSubmit={saveProfile} className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-violet-400/60"
                maxLength={80}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                readOnly
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-gray-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => setName(user.name || "")}
                disabled={savingProfile}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default Profile;

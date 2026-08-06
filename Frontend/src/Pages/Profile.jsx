import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    Camera,
    CalendarDays,
    CheckCircle2,
    Edit3,
    LockKeyhole,
    LogOut,
    Loader2,
    Mail,
    ShieldCheck,
    Trash2,
    User,
    X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardNavbar from "../Components/DashboardNavbar";
import BackButton from "../Components/BackButton";
import ImageCropModal from "../Components/ImageCropModal";
import UserAvatar from "../Components/UserAvatar";
import ForgotPasswordModal from "../AuthPages/ForgotPasswordModal";
import { API_ORIGIN } from "../services/apiConfig";

const supportedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

const maxFileSize = 2 * 1024 * 1024;

const Profile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [user, setUser] = useState(null);
    const [name, setName] = useState("");

    const [selectedFile, setSelectedFile] =
        useState(null);

    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] =
        useState(false);
    const [uploading, setUploading] = useState(false);
    const [removingPicture, setRemovingPicture] =
        useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [showForgotPassword, setShowForgotPassword] =
        useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] =
        useState(false);
    const [showCropModal, setShowCropModal] =
        useState(false);

    const authHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem(
            "token"
        )}`,
    });

    const setFeedback = (successMessage) => {
        setMessage(successMessage);
        setError("");
    };

    const setFailure = (failureMessage) => {
        setError(failureMessage);
        setMessage("");
    };

    const syncUser = useCallback((updatedUser) => {
        setUser(updatedUser);
        setName(updatedUser.name || "");

        localStorage.setItem(
            "user",
            JSON.stringify(updatedUser)
        );

        window.dispatchEvent(
            new CustomEvent("user-updated", {
                detail: updatedUser,
            })
        );
    }, []);

    const handleAuthFailure = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
            replace: true,
        });
    }, [navigate]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.dispatchEvent(
            new CustomEvent("user-updated", {
                detail: null,
            })
        );

        navigate("/login", {
            replace: true,
        });
    }, [navigate]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    handleAuthFailure();
                    return;
                }

                const response = await fetch(
                    `${API_ORIGIN}/api/users/profile`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (response.status === 401) {
                    handleAuthFailure();
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Failed to load profile"
                    );
                }

                syncUser(data.user);
            } catch (err) {
                setError(
                    err.message ||
                        "Failed to load profile"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [handleAuthFailure, syncUser]);

    const chooseImage = () => {
        fileInputRef.current?.click();
    };

    const cancelImageSelection = () => {
        setSelectedFile(null);
        setShowCropModal(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
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
            setFailure(
                "Profile picture must be 2 MB or smaller."
            );
            event.target.value = "";
            return;
        }

        setSelectedFile(file);
        setShowCropModal(true);
        setMessage("");
        setError("");
        event.target.value = "";
    };

    const uploadCroppedPicture = async (croppedFile) => {
        if (!croppedFile || uploading) return;

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append(
                "profilePicture",
                croppedFile
            );

            const response = await fetch(
                `${API_ORIGIN}/api/users/profile-picture`,
                {
                    method: "PATCH",
                    headers: authHeaders(),
                    body: formData,
                }
            );

            const data = await response.json();

            if (response.status === 401) {
                handleAuthFailure();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to upload profile picture"
                );
            }

            syncUser(data.user);
            cancelImageSelection();
            setFeedback(
                "Profile picture updated successfully."
            );
        } catch (err) {
            setFailure(
                err.message ||
                    "Failed to upload profile picture"
            );
        } finally {
            setUploading(false);
        }
    };

    const removeProfilePicture = async () => {
        if (removingPicture || !user?.profilePicture) {
            return;
        }

        try {
            setRemovingPicture(true);

            const response = await fetch(
                `${API_ORIGIN}/api/users/profile-picture`,
                {
                    method: "DELETE",
                    headers: authHeaders(),
                }
            );

            const data = await response.json();

            if (response.status === 401) {
                handleAuthFailure();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to remove profile picture"
                );
            }

            syncUser(data.user);
            setFeedback("Profile picture removed.");
        } catch (err) {
            setFailure(
                err.message ||
                    "Failed to remove profile picture"
            );
        } finally {
            setRemovingPicture(false);
        }
    };

    const saveProfile = async (event) => {
        event.preventDefault();

        const trimmedName = name
            .trim()
            .replace(/\s+/g, " ");

        if (trimmedName.length < 2) {
            setFailure("Name must be at least 2 characters.");
            return;
        }

        try {
            setSavingProfile(true);

            const response = await fetch(
                `${API_ORIGIN}/api/users/profile`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders(),
                    },
                    body: JSON.stringify({
                        name: trimmedName,
                    }),
                }
            );

            const data = await response.json();

            if (response.status === 401) {
                handleAuthFailure();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to update profile"
                );
            }

            syncUser(data.user);
            setFeedback("Profile updated successfully.");
        } catch (err) {
            setFailure(
                err.message ||
                    "Failed to update profile"
            );
        } finally {
            setSavingProfile(false);
        }
    };

    const joinedDate = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString(
              "en-IN",
              {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
              }
          )
        : "Unknown";

    const hasNameChanged =
        name.trim().replace(/\s+/g, " ") !==
        (user?.name || "");

    if (loading) {
        return (
            <div className="min-h-screen bg-[#08080d] text-white">
                <DashboardNavbar fetchProfile={false} />
                <main className="flex min-h-[75vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                        <p className="text-sm text-gray-500">
                            Loading your profile...
                        </p>
                    </div>
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

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <BackButton
                        to="/dashboard"
                        label="Dashboard"
                    />
                </div>

                <div className="mb-8">
                    <p className="text-sm font-medium text-gray-400">
                        Account
                    </p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">
                        Profile Settings
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-gray-500">
                        Manage your personal information,
                        profile picture and account settings.
                    </p>
                </div>

                {(message || error) && (
                    <div
                        className={`mb-6 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                            error
                                ? "border-red-500/20 bg-red-500/10 text-red-200"
                                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                        }`}
                    >
                        {error ? <X size={18} /> : <CheckCircle2 size={18} />}
                        <span>{error || message}</span>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
                    <aside>
                        <div className="sticky top-24 overflow-hidden rounded-3xl border border-[#222] bg-[#121212]">
                            <div className="relative h-28 overflow-hidden border-b border-[#222] bg-[#1b1b1b]">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#303030_0%,#1b1b1b_55%,#121212_100%)]" />
                            </div>

                            <div className="relative px-6 pb-6">
                                <button
                                    type="button"
                                    onClick={chooseImage}
                                    className="group relative -mt-14 block rounded-full"
                                >
                                    <UserAvatar
                                        user={user}
                                        size="xl"
                                        className="ring-4 ring-[#121212] transition group-hover:ring-white/10"
                                    />

                                    <span className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-[#222] bg-white text-black transition group-hover:bg-gray-200">
                                        <Camera size={16} />
                                    </span>
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                <div className="mt-5">
                                    <h2 className="break-words text-xl font-semibold">
                                        {user.name}
                                    </h2>
                                    <p className="mt-1 break-all text-sm text-gray-500">
                                        {user.email}
                                    </p>
                                </div>

                                <div className="mt-5 flex items-center gap-2">
                                    <span className="flex items-center gap-1.5 rounded-full border border-[#222] bg-[#1b1b1b] px-3 py-1 text-xs font-medium text-white">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        Active
                                    </span>

                                    {user.role && (
                                        <span className="rounded-full border border-[#222] bg-[#1b1b1b] px-3 py-1 text-xs font-medium capitalize text-gray-300">
                                            {user.role}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-6 space-y-4 border-t border-[#222] pt-5">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail
                                            size={17}
                                            className="shrink-0 text-gray-600"
                                        />
                                        <span className="truncate text-gray-400">
                                            {user.email}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm">
                                        <CalendarDays
                                            size={17}
                                            className="shrink-0 text-gray-600"
                                        />
                                        <span className="text-gray-400">
                                            Joined {joinedDate}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm">
                                        <ShieldCheck
                                            size={17}
                                            className="shrink-0 text-gray-600"
                                        />
                                        <span className="text-gray-400">
                                            Account verified
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <div className="space-y-6">
                        <section className="overflow-hidden rounded-3xl border border-[#222] bg-[#121212]">
                            <div className="flex items-center gap-4 border-b border-[#222] px-6 py-5">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1b1b1b] text-white">
                                    <User size={19} />
                                </div>
                                <div>
                                    <h2 className="font-semibold">
                                        Personal Information
                                    </h2>
                                    <p className="mt-0.5 text-sm text-gray-500">
                                        Update your personal details.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={saveProfile} className="p-6">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-300">
                                            Display Name
                                        </label>
                                        <div className="relative">
                                            <Edit3
                                                size={16}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
                                            />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(event) =>
                                                    setName(event.target.value)
                                                }
                                                maxLength={80}
                                                className="w-full rounded-xl border border-[#222] bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-white/20 focus:bg-[#1b1b1b]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-300">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail
                                                size={16}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
                                            />
                                            <input
                                                type="email"
                                                value={user.email}
                                                readOnly
                                                className="w-full cursor-not-allowed rounded-xl border border-[#222] bg-[#121212] py-3 pl-11 pr-4 text-sm text-gray-500 outline-none"
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">
                                            Email cannot currently be changed.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#222] pt-5">
                                    <button
                                        type="submit"
                                        disabled={savingProfile || !hasNameChanged}
                                        className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {savingProfile ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Edit3 size={16} />
                                        )}
                                        {savingProfile ? "Saving..." : "Save Changes"}
                                    </button>

                                    {hasNameChanged && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setName(user.name || "")
                                            }
                                            className="rounded-xl px-4 py-2.5 text-sm text-gray-400 transition hover:bg-[#1b1b1b] hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </section>

                        <section className="overflow-hidden rounded-3xl border border-[#222] bg-[#121212]">
                            <div className="flex items-center gap-4 border-b border-[#222] px-6 py-5">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1b1b1b] text-white">
                                    <Camera size={19} />
                                </div>
                                <div>
                                    <h2 className="font-semibold">
                                        Profile Picture
                                    </h2>
                                    <p className="mt-0.5 text-sm text-gray-500">
                                        Click your avatar to choose an image,
                                        crop it, and save the result.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <UserAvatar
                                        user={user}
                                        size="lg"
                                        className="ring-2 ring-white/[0.06]"
                                    />
                                    <div>
                                        <p className="text-sm font-medium">
                                            {user.name}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Your profile photo is visible to
                                            other group members.
                                        </p>
                                    </div>
                                </div>

                                {user.profilePicture ? (
                                    <button
                                        type="button"
                                        onClick={removeProfilePicture}
                                        disabled={removingPicture}
                                        className="inline-flex items-center gap-2 rounded-xl border border-[#222] bg-[#1b1b1b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#303030] disabled:opacity-50"
                                    >
                                        {removingPicture ? (
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                        Remove
                                    </button>
                                ) : (
                                    <span className="text-sm text-gray-500">
                                        No profile picture yet.
                                    </span>
                                )}
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-3xl border border-[#222] bg-[#121212]">
                            <div className="flex items-center gap-4 border-b border-[#222] px-6 py-5">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1b1b1b] text-white">
                                    <LockKeyhole size={19} />
                                </div>
                                <div>
                                    <h2 className="font-semibold">
                                        Security
                                    </h2>
                                    <p className="mt-0.5 text-sm text-gray-500">
                                        Manage your account security.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-medium">
                                        Password
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Change your password if you think
                                        someone else knows it.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowForgotPassword(true)
                                    }
                                    className="shrink-0 rounded-xl border border-[#222] bg-[#121212] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-[#1b1b1b] hover:text-white"
                                >
                                    Change Password
                                </button>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-3xl border border-[#222] bg-[#121212]">
                            <div className="border-b border-[#222] px-6 py-5">
                                <h2 className="font-semibold text-white">
                                    Account Actions
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Manage your current login session.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-medium">
                                        Sign out of CodeGPM
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        You will need to log in again to
                                        access your groups.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowLogoutConfirm(true)
                                    }
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#222] bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-gray-200"
                                >
                                    <LogOut size={17} />
                                    Logout
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4">
                    <div className="w-full max-w-md rounded-3xl border border-[#222] bg-[#121212] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1b1b1b] text-white">
                            <LogOut size={22} />
                        </div>

                        <h3 className="mt-5 text-xl font-semibold">
                            Logout?
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            Are you sure you want to logout from your
                            CodeGPM account?
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowLogoutConfirm(false)
                                }
                            className="rounded-xl border border-[#222] bg-[#121212] px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-[#1b1b1b]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-gray-200"
                        >
                                <LogOut size={16} />
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showForgotPassword && (
                <ForgotPasswordModal
                    onClose={() => setShowForgotPassword(false)}
                />
            )}

            <ImageCropModal
                file={selectedFile}
                open={showCropModal}
                saving={uploading}
                onClose={cancelImageSelection}
                onSave={uploadCroppedPicture}
            />
        </div>
    );
};

export default Profile;

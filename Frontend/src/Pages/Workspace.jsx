import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Check,
    Clock3,
    Code2,
    Copy,
    FileClock,
    Files,
    FolderKanban,
    Rocket,
    ShieldCheck,
    Upload,
    Users,
} from "lucide-react";

import UserAvatar from "../Components/UserAvatar";

const Workspace = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();

    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    // ==========================================
    // FETCH GROUP
    // ==========================================

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                setLoading(true);
                setError("");

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

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to load workspace."
                    );
                }

                setGroup(data);
            } catch (error) {
                console.error("Failed to fetch group:", error);

                setError(
                    error.message || "Failed to load workspace."
                );
            } finally {
                setLoading(false);
            }
        };

        if (groupId) {
            fetchGroup();
        }
    }, [groupId]);

    // ==========================================
    // COPY JOIN CODE
    // ==========================================

    const copyJoinCode = async () => {
        if (!group?.joinCode) return;

        try {
            await navigator.clipboard.writeText(group.joinCode);

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (error) {
            console.error("Failed to copy join code:", error);
        }
    };

    // ==========================================
    // DATE
    // ==========================================

    const formatDate = (date) => {
        if (!date) return "No deadline";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#08080d] text-white">
                <div className="text-center">
                    <div
                        className="
                            mx-auto
                            h-8
                            w-8
                            animate-spin
                            rounded-full
                            border-2
                            border-white/10
                            border-t-violet-500
                        "
                    />

                    <p className="mt-4 text-sm text-gray-500">
                        Loading workspace...
                    </p>
                </div>
            </div>
        );
    }

    // ==========================================
    // ERROR
    // ==========================================

    if (error || !group) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#08080d] px-5 text-white">
                <div className="max-w-md text-center">
                    <FolderKanban
                        size={40}
                        className="mx-auto text-violet-400"
                    />

                    <h1 className="mt-5 text-2xl font-semibold">
                        Workspace unavailable
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-gray-500">
                        {error ||
                            "This workspace could not be loaded."}
                    </p>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="
                            mt-6
                            rounded-xl
                            bg-violet-600
                            px-5
                            py-2.5
                            text-sm
                            font-medium
                            transition
                            hover:bg-violet-500
                        "
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const owner = group.members?.find(
        (member) =>
            member.role?.toLowerCase() === "owner"
    )?.user;

    const validMembers =
        group.members?.filter(
            (member) => member.user
        ) || [];

    const projectInitial =
        group.projectName?.charAt(0)?.toUpperCase() ||
        group.groupName?.charAt(0)?.toUpperCase() ||
        "P";

    return (
        <div className="min-h-screen bg-[#08080d] text-white">

            {/* BACKGROUND */}

            <div className="pointer-events-none fixed inset-0 overflow-hidden">

                <div
                    className="
                        absolute
                        -left-50
                        -top-50
                        h-150
                        w-150
                        rounded-full
                        bg-violet-700/[0.08]
                        blur-[160px]
                    "
                />

                <div
                    className="
                        absolute
                        right-0
                        top-1/3
                        h-125
                        w-125
                        rounded-full
                        bg-purple-800/[0.05]
                        blur-[160px]
                    "
                />

            </div>

            <main className="relative mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10">

                {/* TOP NAV */}

                <div className="mb-6 flex items-center justify-between">

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-white/[0.07]
                            bg-white/[0.03]
                            px-4
                            py-2.5
                            text-sm
                            text-gray-400
                            transition
                            hover:bg-white/[0.06]
                            hover:text-white
                        "
                    >
                        <ArrowLeft size={15} />
                        Dashboard
                    </button>

                    <div className="hidden items-center gap-2 text-xs text-gray-600 sm:flex">
                        <span>WorkSpace</span>
                        <span>/</span>
                        <span className="text-gray-400">
                            {group.groupName}
                        </span>
                    </div>

                </div>

                {/* HERO */}

                <section
                    className="
                        relative
                        mb-6
                        overflow-hidden
                        rounded-[28px]
                        border
                        border-white/[0.08]
                        bg-white/[0.03]
                    "
                >

                    <div
                        className="
                            pointer-events-none
                            absolute
                            -right-20
                            -top-30
                            h-100
                            w-100
                            rounded-full
                            bg-violet-600/10
                            blur-[120px]
                        "
                    />

                    <div className="relative p-6 sm:p-8 lg:p-10">

                        <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">

                            <div className="flex min-w-0 flex-1 flex-col gap-6 sm:flex-row sm:items-center">

                                <div
                                    className="
                                        flex
                                        h-20
                                        w-20
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-3xl
                                        border
                                        border-violet-400/20
                                        bg-linear-to-br
                                        from-violet-500
                                        to-purple-800
                                        text-3xl
                                        font-bold
                                        shadow-[0_20px_60px_rgba(124,58,237,0.2)]
                                    "
                                >
                                    {projectInitial}
                                </div>

                                <div className="min-w-0">

                                    <div className="mb-3 flex flex-wrap items-center gap-2">

                                        <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                                            {group.groupName}
                                        </span>

                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/[0.07] px-3 py-1 text-xs text-emerald-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                            Active
                                        </span>

                                    </div>

                                    <h1 className="truncate text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                                        {group.projectName ||
                                            "Untitled Project"}
                                    </h1>

                                    <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500">
                                        {group.description ||
                                            "Your shared project workspace for files, collaboration and project management."}
                                    </p>

                                </div>

                            </div>

                            {/* ACTIONS */}

                            <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            `/workspace/${groupId}/files?upload=true`
                                        )
                                    }
                                    className="
                                        group
                                        inline-flex
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-xl
                                        bg-violet-600
                                        px-5
                                        py-3
                                        text-sm
                                        font-medium
                                        shadow-[0_10px_30px_rgba(124,58,237,0.25)]
                                        transition
                                        hover:bg-violet-500
                                    "
                                >
                                    <Upload size={17} />
                                    Upload File
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            `/workspace/${groupId}/files`
                                        )
                                    }
                                    className="
                                        inline-flex
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-xl
                                        border
                                        border-white/[0.08]
                                        bg-white/[0.04]
                                        px-5
                                        py-3
                                        text-sm
                                        text-gray-300
                                        transition
                                        hover:bg-white/[0.08]
                                        hover:text-white
                                    "
                                >
                                    <Files size={17} />
                                    View Files
                                </button>

                            </div>

                        </div>

                        {/* STATS */}

                        <div className="mt-9 grid gap-3 border-t border-white/[0.06] pt-6 sm:grid-cols-2 lg:grid-cols-4">

                            <InfoCard
                                icon={Users}
                                label="Members"
                                value={`${validMembers.length} members`}
                            />

                            <InfoCard
                                icon={CalendarDays}
                                label="Deadline"
                                value={formatDate(group.deadline)}
                            />

                            <InfoCard
                                icon={ShieldCheck}
                                label="Owner"
                                customValue={
                                    <div className="flex items-center gap-2">
                                        <UserAvatar
                                            user={owner}
                                            size="sm"
                                        />

                                        <span className="truncate text-sm font-medium text-gray-200">
                                            {owner?.name || "Unknown"}
                                        </span>
                                    </div>
                                }
                            />

                            <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">

                                <p className="text-xs text-gray-600">
                                    Join Code
                                </p>

                                <div className="mt-2 flex items-center justify-between gap-3">

                                    <p className="truncate font-mono text-sm font-semibold tracking-[0.18em] text-gray-200">
                                        {group.joinCode || "N/A"}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={copyJoinCode}
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-gray-500 transition hover:bg-violet-500/10 hover:text-violet-300"
                                    >
                                        {copied ? (
                                            <Check
                                                size={14}
                                                className="text-emerald-400"
                                            />
                                        ) : (
                                            <Copy size={14} />
                                        )}
                                    </button>

                                </div>
                            </div>

                        </div>

                    </div>
                </section>

                {/* CONTENT */}

                <div className="mb-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

                    {/* PROJECT OVERVIEW */}

                    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-7">

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-widest text-violet-400">
                                    Overview
                                </p>

                                <h2 className="mt-2 text-xl font-semibold">
                                    Project Details
                                </h2>
                            </div>

                            <FolderKanban
                                size={20}
                                className="text-gray-700"
                            />
                        </div>

                        <p className="mt-6 text-sm leading-7 text-gray-400">
                            {group.description ||
                                "No project description has been added yet."}
                        </p>

                        <div className="mt-8 grid gap-4 border-t border-white/[0.06] pt-6 sm:grid-cols-2">

                            <Detail
                                label="Group"
                                value={group.groupName}
                            />

                            <Detail
                                label="Project Status"
                                value="Active"
                                success
                            />

                            <Detail
                                label="Deadline"
                                value={formatDate(group.deadline)}
                            />

                            <Detail
                                label="Team Size"
                                value={`${validMembers.length} members`}
                            />

                        </div>
                    </section>

                    {/* TEAM */}

                    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-7">

                        <div className="mb-5 flex items-center justify-between">

                            <div>
                                <p className="text-xs font-medium uppercase tracking-widest text-violet-400">
                                    Team
                                </p>

                                <h2 className="mt-2 text-xl font-semibold">
                                    Members
                                </h2>
                            </div>

                            <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs text-gray-500">
                                {validMembers.length}
                            </span>

                        </div>

                        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">

                            {validMembers.map((member) => (
                                <div
                                    key={member.user._id}
                                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.05] bg-black/20 p-3.5 transition hover:border-violet-500/15 hover:bg-violet-500/[0.025]"
                                >

                                    <div className="flex min-w-0 items-center gap-3">

                                        <UserAvatar
                                            user={member.user}
                                            size="sm"
                                        />

                                        <div className="min-w-0">

                                            <p className="truncate text-sm font-medium text-gray-200">
                                                {member.user.name}
                                            </p>

                                            <p className="mt-0.5 truncate text-xs text-gray-600">
                                                {member.user.email}
                                            </p>

                                        </div>
                                    </div>

                                    <span
                                        className={`
                                            shrink-0
                                            rounded-lg
                                            border
                                            px-2.5
                                            py-1
                                            text-xs
                                            ${
                                                member.role?.toLowerCase() ===
                                                "owner"
                                                    ? "border-violet-500/15 bg-violet-500/10 text-violet-300"
                                                    : "border-white/[0.06] bg-white/[0.03] text-gray-500"
                                            }
                                        `}
                                    >
                                        {member.role}
                                    </span>

                                </div>
                            ))}

                        </div>
                    </section>

                </div>

                {/* WORKSPACE TOOLS */}

                <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-7">

                    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-violet-400">
                                Workspace
                            </p>

                            <h2 className="mt-2 text-2xl font-semibold">
                                Project Tools
                            </h2>

                            <p className="mt-2 text-sm text-gray-600">
                                Everything your team needs in one place.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Clock3 size={13} />
                            Shared workspace
                        </div>

                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                        <ToolCard
                            icon={Files}
                            title="Project Files"
                            description="Upload, preview and manage shared project files."
                            onClick={() =>
                                navigate(
                                    `/workspace/${groupId}/files`
                                )
                            }
                        />

                        <ToolCard
                            icon={FileClock}
                            title="Version History"
                            description="Track and review previous versions of project files."
                            comingSoon
                        />

                        <ToolCard
                            icon={Code2}
                            title="Code Showcase"
                            description="Present your team's code and project work beautifully."
                            comingSoon
                        />

                        <ToolCard
                            icon={Rocket}
                            title="Publish Project"
                            description="Prepare and publish the finished project."
                            comingSoon
                        />

                    </div>
                </section>

                {/* FILE UPLOAD NOTE */}

                <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-violet-500/10 bg-violet-500/[0.035] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                            <Upload size={16} />
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-300">
                                File uploads
                            </p>

                            <p className="mt-0.5 text-xs text-gray-600">
                                Maximum file size: 1 MB per upload
                            </p>
                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                `/workspace/${groupId}/files?upload=true`
                            )
                        }
                        className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 transition hover:text-violet-300"
                    >
                        Upload a file
                        <ArrowRight size={14} />
                    </button>

                </div>

                <footer className="mt-10 border-t border-white/[0.06] py-6">

                    <div className="flex flex-col gap-2 text-xs text-gray-700 sm:flex-row sm:justify-between">
                        <p>CodeGPM Workspace</p>

                        <p>
                            {group.groupName} •{" "}
                            {validMembers.length} members
                        </p>
                    </div>

                </footer>

            </main>
        </div>
    );
};

// ==========================================
// INFO CARD
// ==========================================

function InfoCard({
    icon: Icon,
    label,
    value,
    customValue,
}) {
    return (
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">

            <div className="flex items-center gap-2 text-xs text-gray-600">
                <Icon size={13} />
                {label}
            </div>

            <div className="mt-2">
                {customValue || (
                    <p className="truncate text-sm font-medium text-gray-200">
                        {value}
                    </p>
                )}
            </div>

        </div>
    );
}

// ==========================================
// DETAIL
// ==========================================

function Detail({
    label,
    value,
    success = false,
}) {
    return (
        <div>
            <p className="text-xs text-gray-600">
                {label}
            </p>

            <p
                className={`mt-1.5 text-sm font-medium ${
                    success
                        ? "text-emerald-400"
                        : "text-gray-300"
                }`}
            >
                {value}
            </p>
        </div>
    );
}

// ==========================================
// TOOL CARD
// ==========================================

function ToolCard({
    icon: Icon,
    title,
    description,
    onClick,
    comingSoon = false,
}) {
    return (
        <button
            type="button"
            onClick={comingSoon ? undefined : onClick}
            className={`
                group
                relative
                overflow-hidden
                rounded-2xl
                border
                border-white/[0.06]
                bg-black/20
                p-5
                text-left
                transition-all
                duration-300
                ${
                    comingSoon
                        ? "cursor-default opacity-60"
                        : "hover:-translate-y-1 hover:border-violet-500/20 hover:bg-violet-500/[0.035]"
                }
            `}
        >

            {comingSoon && (
                <span className="absolute right-4 top-4 rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-1 text-[9px] font-medium uppercase tracking-wider text-gray-600">
                    Soon
                </span>
            )}

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 transition group-hover:bg-violet-500/15">
                <Icon size={19} />
            </div>

            <h3 className="mt-5 font-semibold text-gray-200">
                {title}
            </h3>

            <p className="mt-2 min-h-12 text-sm leading-6 text-gray-600">
                {description}
            </p>

            {!comingSoon && (
                <div className="mt-5 flex items-center gap-2 text-xs font-medium text-violet-400">
                    Open

                    <ArrowRight
                        size={13}
                        className="transition-transform group-hover:translate-x-1"
                    />
                </div>
            )}

        </button>
    );
}

export default Workspace;
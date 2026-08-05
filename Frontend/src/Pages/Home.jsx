import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ContactAPI from "../services/contact";
import Particles from "../Styles/Particles";
import CommunityAPI from "../services/community";
import SignupGuide from "../assets/guide/signup.png";
import GroupGuide from "../assets/guide/group.png";
import WorkspaceGuide from "../assets/guide/workspace.png";
import {
    FaGithub,
    FaEnvelope,
    FaPaperPlane,
} from "react-icons/fa";

function Home() {
    const [stats, setStats] = useState({
        users: 0,
        groups: 0,
        files: 0,
        developers: 2,
    });
    const [statsError, setStatsError] = useState("");
    const [feedback, setFeedback] = useState([]);

    useEffect(() => {
        const fetchCommunityStats = async () => {
            try {
                const { data } = await CommunityAPI.get("/stats");

                if (data?.success && data?.stats) {
                    setStats({
                        users: data.stats.users ?? 0,
                        groups: data.stats.groups ?? 0,
                        files: data.stats.files ?? 0,
                        developers: data.stats.developers ?? 2,
                    });
                    setStatsError("");
                } else {
                    setStatsError("Community stats are temporarily unavailable.");
                }
            } catch (error) {
                console.error("Failed to load community stats:", error);
                setStatsError("Community stats are temporarily unavailable.");
            }
        };

        fetchCommunityStats();
    }, []);

    useEffect(() => {
        const fetchPublicFeedback = async () => {
            try {
                const { data } =
                    await ContactAPI.get("/feedback");

                if (data?.success && Array.isArray(data.feedback)) {
                    setFeedback(data.feedback);
                } else {
                    setFeedback([]);
                }
            } catch (error) {
                console.error(
                    "Failed to load public feedback:",
                    error
                );
                setFeedback([]);
            }
        };

        fetchPublicFeedback();
    }, []);

    const communityStats = [
        { value: stats.users, label: "Users" },
        { value: stats.groups, label: "Groups Created" },
        { value: stats.files, label: "Files Shared" },
        { value: stats.developers, label: "Developers" },
    ];

    const [contactForm, setContactForm] = useState({
        name: "",
        email: "",
        message: "",
    });

    const [contactStatus, setContactStatus] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);

    const handleContactChange = (e) => {
        const { name, value } = e.target;

        setContactForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

const handleContactSubmit = async (e) => {
    e.preventDefault();

    if (sendingMessage) return;

    try {
        setSendingMessage(true);
        setContactStatus("");

        const { data } = await ContactAPI.post(
            "/",
            contactForm
        );

        if (data.success) {
            setContactStatus(
                "Message sent successfully!"
            );

            setContactForm({
                name: "",
                email: "",
                message: "",
            });
        }

    } catch (error) {
        setContactStatus(
            error.response?.data?.message ||
            "Something went wrong. Please try again."
        );
    } finally {
        setSendingMessage(false);
    }
};

    return (
        <div className="relative isolate min-h-screen overflow-hidden">

            {/* Particles Background */}
            <div className="absolute inset-0 z-0">
                <Particles
                    particleColors={["#ffffff"]}
                    particleCount={500}
                    particleSpread={8}
                    speed={0.2}
                    particleBaseSize={70}
                    moveParticlesOnHover={true}
                    particleHoverFactor={0.35}
                    alphaParticles={true}
                    disableRotation={false}
                    pixelRatio={1}
                    className="w-full h-full"
                />
            </div>

            {/* Hero Content */}
            <div id="home" className="relative z-10 flex min-h-screen items-center justify-center px-6">

                <div className="absolute inset-0 z-0">
                    <Particles
                        particleColors={["#ffffff"]}
                        particleCount={300}
                        particleSpread={10}
                        speed={0.1}
                        particleBaseSize={70}
                        moveParticlesOnHover={true}
                        particleHoverFactor={0.35}
                        alphaParticles={true}
                        disableRotation={false}
                        pixelRatio={1}
                        className="w-full h-full"
                    />
                </div>

                <div className="max-w-3xl text-center">

                    <h1 className="text-6xl font-bold text-white">
                        Manage Your Group Projects
                    </h1>

                    <p className="mt-6 text-xl text-gray-300">
                        Create a group, invite teammates, upload files,
                        assign tasks, and collaborate from one workspace.
                    </p>

                    <div className="mt-10 z-20 relative flex justify-center gap-5">

                        <Link to="/signup">
                            <button className="
                                cursor-pointer
                                rounded-xl
                                bg-white
                                px-8
                                py-4
                                font-bold 
                                text-black 
                                hover:bg-violet-700/90 
                                hover:text-white 
                                transition-all
                                duration-300
                            ">
                                Get Started
                            </button>
                        </Link>

                        <Link to="/features">
                            <button
                                className="
                                    cursor-pointer
                                    rounded-2xl
                                    border border-white/10
                                    bg-white/5
                                    backdrop-blur-xl
                                    px-8 py-4
                                    font-medium text-white
                                    hover:bg-white/10
                                    transition-all
                                    duration-300"
                            >
                                View Features
                            </button>
                        </Link>

                        <Link to="/login">
                            <button
                                className="
                                    cursor-pointer
                                    rounded-2xl
                                    border border-violet-700/90
                                    bg-violet-700
                                    backdrop-blur-xl
                                    px-8 py-4
                                    font-medium text-white
                                    hover:bg-violet-800/90
                                    hover:border-violet-800/90
                                    transition-all
                                    duration-300"
                            >
                                Sign In
                            </button>
                        </Link>

                    </div>
                </div>
            </div>

            {/* ================= ABOUT SECTION ================= */}
            <section
                id="about"
                className="relative min-h-screen flex items-center justify-center px-6 py-24"
            >
                <div className="max-w-6xl w-full">

                    <div className="text-center mb-10">
                        <p className="text-violet-500 text-2xl font-semibold mb-3">
                            CodeGPM
                        </p>

                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
                            Everything your team needs
                            <br />
                            is one workspace
                        </h2>

                        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                            CodeGPM makes group projects easier by keeping your team,
                            files, code, and collaboration organized in one place.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">

                        <div className="rounded-3xl border border-white/5 bg-white/3 p-8 hover:border-violet-500/40 transition duration-300">
                            <div className="w-12 h-12 rounded-xl bg-violet-600/15 flex items-center justify-center text-violet-400 text-xl mb-3">
                                01
                            </div>

                            <h3 className="text-xl font-semibold text-white mb-1.5">
                                Create Groups
                            </h3>

                            <p className="text-gray-400 leading-relaxed">
                                Create a dedicated workspace for your project, invite your
                                teammates, and keep everyone connected in one organized place

                            </p>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/3 p-8 hover:border-violet-500/40 transition duration-300">
                            <div className="w-12 h-12 rounded-xl bg-violet-600/15 flex items-center justify-center text-violet-400 text-xl mb-3">
                                02
                            </div>

                            <h3 className="text-xl font-semibold text-white mb-1.5">
                                Share Files
                            </h3>

                            <p className="text-gray-400 leading-relaxed">
                                Upload and share project files directly with your group so
                                everyone always has access to the resources they need
                            </p>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/3 p-8 hover:border-violet-500/40 transition duration-300">
                            <div className="w-12 h-12 rounded-xl bg-violet-600/15 flex items-center justify-center text-violet-400 text-xl mb-3">
                                03
                            </div>

                            <h3 className="text-xl font-semibold text-white mb-1.5">
                                Collaborate Together
                            </h3>

                            <p className="text-gray-400 leading-relaxed">
                                Work together from a shared workspace where every member can
                                contribute, stay updated, and keep the project moving forward
                            </p>
                        </div>

                    </div>
                </div>
            </section>


            {/* ================= GUIDE SECTION ================= */}
            <section
                id="guide"
                className="relative px-6 py-28 scroll-mt-5"
            >
                <div className="max-w-7xl mx-auto">

                    {/* Heading */}
                    <div className="text-center mb-24">
                        <p className="text-violet-500 text-xl font-semibold mb-3">
                            How It Works?
                        </p>

                        <h2 className="text-4xl md:text-5xl font-bold text-white">
                            Get started and collaborate in minutes
                        </h2>

                        <p className="text-gray-400 mt-5 max-w-2xl mx-auto text-lg">
                            From creating your account to working with your team,
                            CodeGPM keeps the entire process simple.
                        </p>
                    </div>


                    {/* ================= STEP 01 ================= */}

                    <div className="grid lg:grid-cols-[0.7fr_1.5fr] gap-16 items-center mb-40">

                        {/* Content */}
                        <div>
                            <span className="text-violet-500 font-semibold text-lg">
                                01
                            </span>

                            <h3 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-5">
                                Create your account
                            </h3>

                            <p className="text-gray-400 text-lg leading-8">
                                Create your CodeGPM account in just a few steps.
                                Once you're signed in, you'll get access to your
                                personal dashboard where you can manage your groups,
                                projects, and collaborations.
                            </p>
                        </div>


                        {/* Screenshot Card */}
                        <div
                            className="
                    relative
                    rounded-3xl
                    border border-violet-500/20
                    bg-linear-to-br
                    from-violet-600/30
                    via-violet-900/20
                    to-white/5
                    p-8
                    md:p-10
                    overflow-hidden
                    max-w-187.5
                "
                        >

                            {/* Background glow */}
                            <div
                                className="
                        absolute
                        w-80 h-80
                        bg-violet-600/30
                        blur-[120px]
                        rounded-full
                        top-0 right-0
                        pointer-events-none
                    "
                            />

                            <img
                                src={SignupGuide}
                                alt="CodeGPM signup screen"
                                className="
                        relative z-10
                        w-full
                        rounded-2xl
                        border border-white/10
                        shadow-2xl
                    "
                            />

                        </div>

                    </div>


                    {/* ================= STEP 02 ================= */}

                    <div className="grid lg:grid-cols-[1.5fr_0.7fr] gap-16 items-center mb-40">

                        {/* Screenshot Card */}
                        <div
                            className="
                    relative
                    rounded-3xl
                    border border-violet-500/20
                    bg-linear-to-br
                    from-violet-600/30
                    via-violet-900/20
                    to-white/5
                    p-8
                    md:p-10
                    overflow-hidden
                    max-w-187.5
                    order-2 lg:order-1
                "
                        >

                            <div
                                className="
                        absolute
                        w-80 h-80
                        bg-violet-600/30
                        blur-[120px]
                        rounded-full
                        bottom-0 left-0
                        pointer-events-none
                    "
                            />

                            <img
                                src={GroupGuide}
                                alt="CodeGPM group screen"
                                className="
                        relative z-10
                        w-full
                        rounded-2xl
                        border border-white/10
                        shadow-2xl
                    "
                            />

                        </div>


                        {/* Content */}
                        <div className="order-1 lg:order-2">

                            <span className="text-violet-500 font-semibold text-lg">
                                02
                            </span>

                            <h3 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-5">
                                Create or join a group
                            </h3>

                            <p className="text-gray-400 text-lg leading-8">
                                Create a workspace for your own project or join your
                                teammates using a group invite code. Everyone gets
                                access to the same shared project environment.
                            </p>

                        </div>

                    </div>


                    {/* ================= STEP 03 ================= */}

                    <div className="grid lg:grid-cols-[0.7fr_1.5fr] gap-16 items-center">

                        {/* Content */}
                        <div>

                            <span className="text-violet-500 font-semibold text-lg">
                                03
                            </span>

                            <h3 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-5">
                                Build together
                            </h3>

                            <p className="text-gray-400 text-lg leading-8">
                                Your workspace becomes the central place for your
                                project. Share files, collaborate with teammates,
                                organize project resources, and keep everyone working
                                together from one place.
                            </p>

                        </div>


                        {/* Screenshot Card */}
                        <div
                            className="
                    relative
                    rounded-3xl
                    border border-violet-500/20
                    bg-linear-to-br
                    from-violet-600/30
                    via-violet-900/20
                    to-white/5
                    p-8
                    md:p-10
                    overflow-hidden
                    max-w-187.5
                "
                        >

                            <div
                                className="
                        absolute
                        w-80 h-80
                        bg-violet-600/30
                        blur-[120px]
                        rounded-full
                        top-1/2 left-1/2
                        -translate-x-1/2
                        -translate-y-1/2
                        pointer-events-none
                    "
                            />

                            <img
                                src={WorkspaceGuide}
                                alt="CodeGPM workspace screen"
                                className="
                        relative z-10
                        w-full
                        rounded-2xl
                        border border-white/10
                        shadow-2xl
                    "
                            />

                        </div>

                    </div>

                </div>
            </section>


            {/* ================= COMMUNITY SECTION ================= */}
            <section
                id="community"
                className="relative px-6 py-28 scroll-mt-5"
            >
                <div className="max-w-7xl mx-auto">

                    {/* Heading */}
                    <div className="text-center mb-20">
                        <p className="text-violet-500 text-xl font-semibold mb-3">
                            Our Community
                        </p>

                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-5">
                            Built by students, for students.
                        </h2>

                        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                            CodeGPM started as an idea between two friends who wanted
                            a simpler way to manage group projects. Now we're building
                            it with feedback from the people who actually use it.
                        </p>
                    </div>


                    {/* ================= BUILDERS ================= */}

                    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-20">

                        {/* You */}
                        <div
                            className="
                    rounded-3xl
                    border border-white/10
                    bg-white/3
                    p-8
                    text-center
                    hover:border-violet-500/40
                    transition
                "
                        >
                            <div
                                className="
                        w-20 h-20
                        mx-auto mb-5
                        rounded-full
                        bg-violet-600/20
                        border border-violet-500/30
                        flex items-center justify-center
                        text-2xl font-bold text-violet-400
                    "
                            >
                                P
                            </div>

                            <h3 className="text-xl font-semibold text-white">
                                Priyangshu
                            </h3>

                            <p className="text-violet-400 text-sm mt-1">
                                Developer
                            </p>

                            <p className="text-gray-400 mt-4">
                                “Working together sounded easy until we both decided to change the exact same file at the exact same time”💀
                            </p>
                            <a
                                href="https://github.com/prd6"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                                    inline-flex items-center gap-2
                                    mt-6
                                    px-5 py-2.5
                                    rounded-xl
                                    border border-white/10
                                    bg-white/5
                                    text-sm font-medium text-white
                                    hover:bg-violet-600/15
                                    hover:border-violet-500/50
                                    hover:text-violet-300
                                    transition-all duration-300
                                    cursor-pointer
                            ">
                                <FaGithub className="text-lg" />
                                View GitHub
                            </a>
                        </div>


                        {/* Friend */}
                        <div
                            className="
                    rounded-3xl
                    border border-white/10
                    bg-white/3
                    p-8
                    text-center
                    hover:border-violet-500/40
                    transition
                "
                        >
                            <div
                                className="
                        w-20 h-20
                        mx-auto mb-5
                        rounded-full
                        bg-violet-600/20
                        border border-violet-500/30
                        flex items-center justify-center
                        text-2xl font-bold text-violet-400
                    "
                            >
                                S
                            </div>

                            <h3 className="text-xl font-semibold text-white">
                                Sabarna
                            </h3>

                            <p className="text-violet-400 text-sm mt-1">
                                Developer
                            </p>

                            <p className="text-gray-400 mt-4">
                                “That’s how CodeGPM taught us collaboration before we even finished building a collaboration platform”😭
                            </p>
                            <a
                                href="https://github.com/sabarna-dev"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                                    inline-flex items-center gap-2
                                    mt-6
                                    px-5 py-2.5
                                    rounded-xl
                                    border border-white/10
                                    bg-white/5
                                    text-sm font-medium text-white
                                    hover:bg-violet-600/15
                                    hover:border-violet-500/50
                                    hover:text-violet-300
                                    transition-all duration-300
                                    cursor-pointer
                            ">
                                <FaGithub className="text-lg" />
                                View GitHub
                            </a>
                        </div>

                    </div>


                    {/* ================= STATS ================= */}


                    <div
                        className="
                grid grid-cols-2 md:grid-cols-4
                border-b border-white/10
                py-12
                mb-24
            "
                    >
                        {communityStats.map((item, index) => (
                            <div
                                key={item.label}
                                className={`text-center ${index > 1 ? "mt-8 md:mt-0" : ""}`}
                            >
                                <h3 className="text-4xl font-bold text-white">
                                    {item.value}
                                </h3>
                                <p className="text-gray-500 mt-2">
                                    {item.label}
                                </p>
                            </div>
                        ))}
                    </div>

                    {statsError && (
                        <p className="-mt-16 mb-20 text-center text-sm text-gray-500">
                            {statsError}
                        </p>
                    )}


                    {/* ================= USER FEEDBACK ================= */}

                    <div>
                        <div className="mb-10">
                            <p className="text-violet-500 font-semibold mb-2">
                                What people say
                            </p>

                            <h2 className="text-3xl md:text-4xl font-bold text-white">
                                Built with our users.
                            </h2>
                        </div>


{feedback.length === 0 ? (
    <div className="rounded-3xl border border-white/10 bg-white/3 p-8 text-center">
        <p className="text-gray-400">
            No community feedback yet.
        </p>
    </div>
) : (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {feedback.map((item) => (
            <article
                key={item._id}
                className="
                    group
                    relative
                    flex
                    min-h-65
                    flex-col
                    overflow-hidden
                    rounded-3xl
                    border
                    border-white/10
                    bg-white/3
                    p-7
                    text-left
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:border-violet-500/40
                    hover:bg-white/5
                    hover:shadow-[0_20px_60px_rgba(124,58,237,0.12)]
                "
            >
                {/* Glow */}
                <div
                    className="
                        pointer-events-none
                        absolute
                        -right-16
                        -top-16
                        h-40
                        w-40
                        rounded-full
                        bg-violet-600/10
                        blur-3xl
                        transition
                        duration-300
                        group-hover:bg-violet-600/20
                    "
                />

                {/* Feedback */}
                <div className="relative flex-1">
                    <span className="block font-serif text-5xl leading-none text-violet-500/50">
                        “
                    </span>

                    <p className="-mt-2 text-[15px] leading-7 text-gray-300">
                        {item.message}
                    </p>
                </div>

                {/* User */}
                <div className="relative mt-7 flex items-center gap-3 border-t border-white/8 pt-5">

                    {/* Avatar */}
                    <div
                        className="
                            flex
                            h-11
                            w-11
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            border
                            border-violet-500/25
                            bg-violet-600/15
                            text-sm
                            font-bold
                            uppercase
                            text-violet-300
                        "
                    >
                        {item.name?.charAt(0)}
                    </div>

                    {/* Name */}
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">
                            {item.name}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                            CodeGPM User
                        </p>
                    </div>

                    {/* Date */}
                    <p className="shrink-0 text-xs text-gray-600">
                        {new Date(item.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            }
                        )}
                    </p>
                </div>
            </article>
        ))}
    </div>
)}
                    </div>

                </div>
            </section>

            {/* ================= CONTACT SECTION ================= */}

            <section
                id="contact"
                className="relative px-6 py-28 scroll-mt-5"
            >
                {/* Background glow */}
                <div
                    className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            h-125
            w-125
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-violet-700/10
            blur-[140px]
        "
                />

                <div className="relative mx-auto max-w-7xl">

                    {/* Heading */}

                    <div className="mb-16 text-center">
                        <p className="mb-3 text-xl font-semibold text-violet-500">
                            Contact Us
                        </p>

                        <h2 className="text-4xl font-bold text-white md:text-5xl">
                            Got something to say?
                        </h2>

                        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-400">
                            Found a bug, have an idea, or just want
                            to talk about CodeGPM? We'd love to
                            hear from you.
                        </p>
                    </div>

                    {/* Main Card */}

                    <div
                        className="
                mx-auto
                grid
                max-w-5xl
                overflow-hidden
                rounded-3xl
                border
                border-white/10
                bg-white/3
                lg:grid-cols-[0.8fr_1.2fr]
            "
                    >

                        {/* ================= LEFT ================= */}

                        <div
                            className="
                    relative
                    overflow-hidden
                    border-b
                    border-white/10
                    p-8
                    md:p-10
                    lg:border-b-0
                    lg:border-r
                "
                        >
                            {/* Glow */}

                            <div
                                className="
                        pointer-events-none
                        absolute
                        -left-20
                        -top-20
                        h-64
                        w-64
                        rounded-full
                        bg-violet-600/20
                        blur-[100px]
                    "
                            />

                            <div className="relative">

                                <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-400">
                                    Let's talk
                                </p>

                                <h3 className="mt-4 text-3xl font-semibold leading-tight text-white">
                                    Help us make
                                    <br />
                                    CodeGPM better.
                                </h3>

                                <p className="mt-5 leading-7 text-gray-400">
                                    Whether you've discovered an issue,
                                    have a feature request, or want to
                                    share feedback, send us a message.
                                </p>

                                {/* Contact options */}

                                <div className="mt-10 space-y-4">

                                    <div
                                        className="
                                flex
                                items-center
                                gap-4
                                rounded-2xl
                                border
                                border-white/5
                                bg-white/3
                                p-4
                            "
                                    >
                                        <div
                                            className="
                                    flex
                                    h-11
                                    w-11
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-violet-600/15
                                    text-violet-400
                                "
                                        >
                                            <FaEnvelope />
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Email
                                            </p>

                                            <p className="mt-0.5 text-sm text-white">
                                                Contact the CodeGPM team
                                            </p>
                                        </div>
                                    </div>

                                    <a
                                        href="https://github.com/prd6/Group-Project-Manager"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="
                                flex
                                items-center
                                gap-4
                                rounded-2xl
                                border
                                border-white/5
                                bg-white/3
                                p-4
                                transition
                                hover:border-violet-500/30
                                hover:bg-violet-600/5
                            "
                                    >
                                        <div
                                            className="
                                    flex
                                    h-11
                                    w-11
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-violet-600/15
                                    text-violet-400
                                "
                                        >
                                            <FaGithub />
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500">
                                                GitHub
                                            </p>

                                            <p className="mt-0.5 text-sm text-white">
                                                Follow the development
                                            </p>
                                        </div>
                                    </a>

                                </div>

                                <p className="mt-10 text-xs leading-5 text-gray-600">
                                    We read every message and use your
                                    feedback to improve CodeGPM.
                                </p>

                            </div>
                        </div>

                        {/* ================= FORM ================= */}

                        <div className="p-8 md:p-10">

                            <form
                                onSubmit={handleContactSubmit}
                                className="space-y-5"
                            >

                                {/* Name */}

                                <div>
                                    <label
                                        htmlFor="contact-name"
                                        className="mb-2 block text-sm font-medium text-gray-300"
                                    >
                                        Your name
                                    </label>

                                    <input
                                        id="contact-name"
                                        name="name"
                                        type="text"
                                        value={contactForm.name}
                                        onChange={handleContactChange}
                                        placeholder="Enter your name"
                                        required
                                        className="
                                w-full
                                rounded-xl
                                border
                                border-white/10
                                bg-black/20
                                px-4
                                py-3.5
                                text-white
                                outline-none
                                transition
                                placeholder:text-gray-600
                                focus:border-violet-500/60
                                focus:bg-violet-600/5
                            "
                                    />
                                </div>

                                {/* Email */}

                                <div>
                                    <label
                                        htmlFor="contact-email"
                                        className="mb-2 block text-sm font-medium text-gray-300"
                                    >
                                        Email address
                                    </label>

                                    <input
                                        id="contact-email"
                                        name="email"
                                        type="email"
                                        value={contactForm.email}
                                        onChange={handleContactChange}
                                        placeholder="you@example.com"
                                        required
                                        className="
                                w-full
                                rounded-xl
                                border
                                border-white/10
                                bg-black/20
                                px-4
                                py-3.5
                                text-white
                                outline-none
                                transition
                                placeholder:text-gray-600
                                focus:border-violet-500/60
                                focus:bg-violet-600/5
                            "
                                    />
                                </div>

                                {/* Message */}

                                <div>
                                    <label
                                        htmlFor="contact-message"
                                        className="mb-2 block text-sm font-medium text-gray-300"
                                    >
                                        Message
                                    </label>

                                    <textarea
                                        id="contact-message"
                                        name="message"
                                        value={contactForm.message}
                                        onChange={handleContactChange}
                                        placeholder="Tell us what's on your mind..."
                                        rows={6}
                                        required
                                        className="
                                w-full
                                resize-none
                                rounded-xl
                                border
                                border-white/10
                                bg-black/20
                                px-4
                                py-3.5
                                text-white
                                outline-none
                                transition
                                placeholder:text-gray-600
                                focus:border-violet-500/60
                                focus:bg-violet-600/5
                            "
                                    />
                                </div>

                                {/* Status */}

                                {contactStatus && (
                                    <p
                                        className={`
                                text-sm
                                ${contactStatus.includes(
                                            "successfully"
                                        )
                                                ? "text-emerald-400"
                                                : "text-red-400"
                                            }
                            `}
                                    >
                                        {contactStatus}
                                    </p>
                                )}

                                {/* Submit */}

                                <button
                                    type="submit"
                                    disabled={sendingMessage}
                                    className="
                            flex
                            w-full
                            cursor-pointer
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-violet-600
                            px-6
                            py-4
                            font-medium
                            text-white
                            transition-all
                            duration-300
                            hover:bg-violet-500
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                                >
                                    <FaPaperPlane />

                                    {sendingMessage
                                        ? "Sending..."
                                        : "Send Message"}
                                </button>

                            </form>
                        </div>

                    </div>

                </div>
            </section>

        </div>
    );
}

export default Home;

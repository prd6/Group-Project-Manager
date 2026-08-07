import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ContactAPI from "../services/contact";
import CountUp from "../Styles/CountUp"; // adjust the path
import GalaxyBackground from "../Styles/GalaxyBackground"
import CommunityAPI from "../services/community";
import SignupGuide from "../assets/guide/signup.png";
import GroupGuide from "../assets/guide/group.png";
import WorkspaceGuide from "../assets/guide/workspace.png";
import {
    FaGithub,
    FaEnvelope,
    FaPaperPlane,
    FaFileAlt,
    FaLayerGroup,
    FaTeamspeak
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

            {/* Hero Content */}
            <div id="home" className="relative z-10 flex min-h-screen items-center justify-center px-6">

                <GalaxyBackground />

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
                                border border-transparent
                                rounded-full
                                bg-white
                                px-8
                                py-4
                                text-black 
                            ">
                                Get Started
                            </button>
                        </Link>

                        <Link to="/login">
                            <button
                                className="
                                    cursor-pointer
                                    rounded-full
                                    border border-transparent
                                    bg-black
                                    
                                    px-8 py-4
                                    font-medium text-white
                                    hover:bg-[#121212]
                                    transition-all
                                    duration-200"
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

                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-2">
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

                        <div className="rounded-xl border border-trasparent bg-[#121212] p-8">

                            <h3 className="text-xl font-semibold text-white mb-1.5 flex items-center gap-2">
                                <FaLayerGroup /> Create Groups
                            </h3>

                            <p className="text-gray-400 leading-relaxed">
                                Create a dedicated workspace for your project, invite your
                                teammates, and keep everyone connected in one organized place

                            </p>
                        </div>

                        <div className="rounded-xl border border-trasparent bg-[#121212] p-8">

                            <h3 className="text-xl font-semibold text-white mb-1.5 flex items-center gap-2">
                                <FaFileAlt /> Share Files
                            </h3>

                            <p className="text-gray-400 leading-relaxed">
                                Upload and share project files directly with your group so
                                everyone always has access to the resources they need
                            </p>
                        </div>

                        <div className="rounded-xl border border-trasparent bg-[#121212] p-8">

                            <h3 className="text-xl font-semibold text-white mb-1.5 flex items-center gap-2">
                                <FaTeamspeak /> Collaborate Together
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

                        <h2 className="text-4xl md:text-6xl font-bold text-white">
                            Get started and collaborate in minutes
                        </h2>
                    </div>

                    {/* ================= STEP 01 ================= */}

                    <div className="grid lg:grid-cols-[0.9fr_1.3fr] gap-16 items-end mb-40">

                        {/* Content */}
                        <div>
                            <h3 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-5">
                                Create your account
                            </h3>

                            <p className="text-white text-lg leading-8">
                                Create your CodeGPM account in just a few steps.
                                Once you're signed in, you'll get access to your
                                personal dashboard where you can manage your groups,
                                projects, and collaborations.
                            </p>
                        </div>

                        <img
                            src={SignupGuide}
                            alt="CodeGPM signup screen"
                            className="
                                relative z-10
                                w-full
                                rounded-lg
                                border border-white"
                        />
                    </div>


                    {/* ================= STEP 02 ================= */}

                    <div className="grid lg:grid-cols-[1.3fr_0.9fr] gap-16 items-end mb-40">

                        <img
                            src={GroupGuide}
                            alt="CodeGPM group screen"
                            className="
                        relative z-10
                        w-full
                        rounded-lg
                        border border-white
                    "
                        />



                        {/* Content */}
                        <div className="order-1 lg:order-2">

                            <h3 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-5">
                                Create or join a group
                            </h3>

                            <p className="text-white text-lg leading-8">
                                Create a workspace for your own project or join your
                                teammates using a group invite code. Everyone gets
                                access to the same shared project environment.
                            </p>

                        </div>

                    </div>


                    {/* ================= STEP 03 ================= */}

                    <div className="grid lg:grid-cols-[0.9fr_1.3fr] gap-16 items-end">

                        {/* Content */}
                        <div>

                            <h3 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-5">
                                Build together
                            </h3>

                            <p className="text-white text-lg leading-8">
                                Your workspace becomes the central place for your
                                project. Share files, collaborate with teammates,
                                organize project resources, and keep everyone working
                                together from one place.
                            </p>

                        </div>

                        <img
                            src={WorkspaceGuide}
                            alt="CodeGPM workspace screen"
                            className="
                        relative z-10
                        w-full
                        rounded-lg
                        border border-white
                        shadow-2xl
                    "
                        />
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

                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-5">
                            Built by students, for students.
                        </h2>

                    </div>

                    {/* ================= STATS ================= */}


                    <div className="grid grid-cols-2 md:grid-cols-4 mb-20">
                        {communityStats.map((item, index) => (
                            <div
                                key={item.label}
                                className={`text-center ${index > 1 ? "mt-8 md:mt-0" : ""}`}
                            >
                                <h3 className="text-4xl font-bold text-white">
                                    <CountUp
                                        from={0}
                                        to={Number(item.value)}
                                        separator=","
                                        duration={2}
                                        className="text-4xl font-bold text-white"
                                    />
                                    {typeof item.value === "string" &&
                                        item.value.replace(/[0-9,]/g, "")}
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


                    {/* ================= BUILDERS ================= */}

                    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-20">

                        {/* You */}
                        <div
                            className="
        rounded-xl
        border border-transparent
        bg-[#121212]
        p-8
        text-center
    "
                        >
                            <div className="w-20 h-20 mx-auto mb-5 rounded-full border border-transparent overflow-hidden">
                                <img
                                    src="https://i.pinimg.com/736x/35/ab/1c/35ab1c1f01cafc4d40fa02508dbb4e1b.jpg"
                                    alt="Priyangshu"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <h3 className="text-xl font-semibold text-white">
                                Priyangshu
                            </h3>

                            <p className="text-white text-sm mt-1">
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
            border border-transparent
            bg-black
            text-sm font-medium text-white
            hover:bg-[#1b1b1b]
            transition-all duration-300
            cursor-pointer
        "
                            >
                                <FaGithub className="text-lg" />
                                View GitHub
                            </a>
                        </div>


                        {/* Friend */}
                        <div
                            className="
                    rounded-xl
                    border border-transparent
                    bg-[#121212]
                    p-8
                    text-center
                "
                        >
                            <div className="w-20 h-20 mx-auto mb-5 rounded-full border border-transparent overflow-hidden">

                                <img src="https://i.pinimg.com/1200x/85/a6/99/85a69912405712de7ecd3762c2d860ac.jpg" alt="" />
                            </div>

                            <h3 className="text-xl font-semibold text-white">
                                Sabarna
                            </h3>

                            <p className="text-white text-sm mt-1">
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
                                    border border-transparent
                                    bg-black
                                    text-sm font-medium text-white
                                    hover:bg-[#1b1b1b]
                                    transition-all duration-300
                                    cursor-pointer
                            ">
                                <FaGithub className="text-lg" />
                                View GitHub
                            </a>
                        </div>

                    </div>

                    {/* ================= USER FEEDBACK ================= */}

                    <div>
                        <div className="mb-10">

                            <h2 className="text-3xl md:text-5xl font-bold text-white">
                                What Others are Saying
                            </h2>
                        </div>

                        {feedback.length === 0 ? (
                            <div className="rounded-xl border border-transparent bg-[#121212] p-8 text-center">
                                <p className="text-white">
                                    No community feedback yet.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                        rounded-sm
                        border
                        border-transparent
                        bg-[#303030]
                        p-7
                        text-left
                    "
                                    >
                                        {/* Quote */}
                                        <div className="relative flex-1">
                                            <div
                                                className="
                                flex
                                h-11
                                w-11
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-[#121212]
                                mb-5
                                text-sm
                                font-bold
                                uppercase
                                text-white
                            "
                                            >
                                                {item.name?.charAt(0)}
                                            </div>

                                            <p className="-mt-2 text-[15px] leading-7 text-white">
                                                &ldquo;{item.message}&rdquo;
                                            </p>
                                        </div>

                                        {/* User */}
                                        <div className="relative mt-7 flex items-center gap-3 pt-5">


                                            {/* Name */}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold text-white">
                                                    ~{item.name}
                                                </p>
                                            </div>

                                            {/* Date */}
                                            <p className="shrink-0 text-xs text-gray-500">
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

                <div className="relative mx-auto max-w-7xl">

                    {/* Heading */}

                    <div className="mb-16 text-center">

                        <h2 className="text-4xl font-bold text-white md:text-6xl">
                            Got something to say?
                        </h2>

                    </div>

                    {/* Main Card */}

                    <div
                        className="
                mx-auto
                grid
                max-w-5xl
                overflow-hidden
                rounded-xl
                border
                border-transparent
                bg-[#121212]
                lg:grid-cols-[0.9fr_1.5fr]
            "
                    >

                        {/* ================= LEFT ================= */}

                        <div
                            className="
                    relative
                    overflow-hidden
                    border-b
                    border-transparent
                    p-8
                    md:p-10
                    lg:border-b-0
                    lg:border-r
                "
                        >

                            <div className="relative">

                                <h3 className="mt-4 text-3xl font-semibold leading-tight text-white">
                                    Help us make
                                    <br />
                                    CodeGPM better.
                                </h3>

                                <p className="mt-5 leading-7 text-white/60">
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
                                    bg-white
                                    text-black
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
                                hover:bg-white/5
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
                                    bg-white
                                    text-black
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
                                border-transparent
                                bg-black/20
                                px-4
                                py-3.5
                                text-white
                                outline-none
                                transition
                                placeholder:text-gray-600
                                focus:bg-[#1b1b1b]
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
                                border-transparent
                                bg-black/20
                                px-4
                                py-3.5
                                text-white
                                outline-none
                                transition
                                placeholder:text-gray-600
                                focus:bg-[#1b1b1b]
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
                                border-transparent
                                bg-black/20
                                px-4
                                py-3.5
                                text-white
                                outline-none
                                transition
                                placeholder:text-gray-600
                                focus:bg-[#1b1b1b]
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
                            bg-white
                            px-6
                            py-4
                            font-medium
                            text-black
                            transition-all
                            duration-300
                            hover:bg-white
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

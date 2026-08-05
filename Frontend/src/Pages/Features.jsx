import {
    CalendarCheck2,
    Files,
    History,
    LockKeyhole,
    MessagesSquare,
    Users2,
} from "lucide-react";
import { Link } from "react-router-dom";
import BackButton from "../Components/BackButton";

const featureCards = [
    {
        icon: Users2,
        title: "Group Management",
        description:
            "Create teams, invite members, and keep every project workspace organized in one place.",
    },
    {
        icon: MessagesSquare,
        title: "Real-time Chat",
        description:
            "Keep conversations flowing inside your workspace so teammates can move faster together.",
    },
    {
        icon: Files,
        title: "File Sharing",
        description:
            "Upload, view, and share project files with your group without leaving the app.",
    },
    {
        icon: History,
        title: "Version History",
        description:
            "Track updates over time and stay aware of how your shared work evolves.",
    },
    {
        icon: CalendarCheck2,
        title: "Project Collaboration",
        description:
            "Coordinate work across tasks and project milestones while keeping everyone aligned.",
    },
    {
        icon: LockKeyhole,
        title: "Secure Authentication",
        description:
            "Protect every workspace with verified account access, OTP checks, and secure sessions.",
    },
];

export default function Features() {
    return (
        <div className="min-h-screen overflow-hidden bg-[#08080d] text-white">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-700/15 blur-[130px]" />
                <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-fuchsia-600/10 blur-[150px]" />
            </div>

            <main className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
                <section className="max-w-3xl">
                    <p className="text-sm font-medium uppercase tracking-[0.28em] text-violet-400">
                        Features
                    </p>
                    <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                        Everything teams need to plan, chat, share, and ship together.
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg">
                        CodeGPM brings group coordination, real-time communication,
                        secure account access, and shared project tools into one
                        clean workspace.
                    </p>
                </section>

                <section className="mt-16">
                    <div className="pointer-events-none overflow-hidden rounded-3xl border border-white/10">
                        <div className="aspect-video">
                            <iframe
                                className="h-full w-full"
                                src="https://www.youtube.com/embed/aAvDI1qae-U?autoplay=1&mute=1&loop=1&playlist=aAvDI1qae-U&controls=0&rel=0"
                                title="CodeGPM Demo"
                                allow="autoplay"
                            />
                        </div>
                    </div>
                </section>

                <section className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {featureCards.map((feature) => {
                        const Icon = feature.icon;

                        return (
                            <article
                                key={feature.title}
                                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-6 transition hover:-translate-y-1 hover:border-violet-500/30 hover:bg-white/5"
                            >
                                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-600/10 blur-3xl transition group-hover:bg-violet-600/20" />

                                <div className="relative">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/15 text-violet-300">
                                        <Icon size={20} />
                                    </div>

                                    <h2 className="mt-5 text-xl font-semibold text-white">
                                        {feature.title}
                                    </h2>

                                    <p className="mt-3 text-sm leading-6 text-gray-400">
                                        {feature.description}
                                    </p>
                                </div>
                            </article>
                        );
                    })}
                </section>

                <section className="mt-16 overflow-hidden rounded-3xl border border-violet-500/20 bg-linear-to-r from-violet-600/15 via-white/4 to-fuchsia-600/10 p-8 sm:p-10">
                    <div className="max-w-2xl">
                        <p className="text-sm font-medium uppercase tracking-[0.22em] text-violet-300">
                            Built for collaboration
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
                            One place for the full project workflow.
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-gray-300 sm:text-base">
                            From account verification to group discussions and shared
                            files, CodeGPM keeps your team moving without extra tools
                            getting in the way.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                to="/signup"
                                className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-100"
                            >
                                Create account
                            </Link>
                            <BackButton to="/" label="Home" />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

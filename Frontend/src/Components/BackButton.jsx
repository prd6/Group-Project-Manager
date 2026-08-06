import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const BackButton = ({
    to,
    label = "Back",
    className = "",
}) => {
    return (
        <Link
            to={to}
            className={`
                inline-flex
                items-center
                gap-2
                rounded-xl
                border border-[#222]
                bg-[#121212]
                px-4
                py-2.5
                text-sm
                text-gray-300
                transition
                hover:bg-[#1b1b1b]
                hover:text-white
                ${className}
            `}
        >
            <ArrowLeft size={15} />
            <span>{label}</span>
        </Link>
    );
};

export default BackButton;

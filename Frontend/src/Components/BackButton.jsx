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
                ${className}
            `}
        >
            <ArrowLeft size={15} />
            <span>{label}</span>
        </Link>
    );
};

export default BackButton;

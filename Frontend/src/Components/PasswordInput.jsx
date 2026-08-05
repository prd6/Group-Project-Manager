import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const PasswordInput = ({
    className = "",
    wrapperClassName = "relative",
    ...props
}) => {
    const [visible, setVisible] = useState(false);

    return (
        <div className={wrapperClassName}>
            <input
                {...props}
                type={visible ? "text" : "password"}
                className={`${className} pr-12`}
            />

            <button
                type="button"
                onClick={() => setVisible((prev) => !prev)}
                aria-label={
                    visible
                        ? "Hide password"
                        : "Show password"
                }
                className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-full
                    text-[#b7adc7]
                    transition
                    hover:bg-white/5
                    hover:text-white
                "
            >
                {visible ? (
                    <EyeOff size={17} />
                ) : (
                    <Eye size={17} />
                )}
            </button>
        </div>
    );
};

export default PasswordInput;

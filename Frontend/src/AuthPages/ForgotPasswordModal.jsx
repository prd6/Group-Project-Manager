import { useEffect, useRef, useState } from "react";
import AuthAPI from "../services/auth";
import PasswordInput from "../Components/PasswordInput";

export default function ForgotPasswordModal({ onClose }) {
    const [step, setStep] = useState("email");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");

    const [loading, setLoading] = useState(false);
    const [verifyingOTP, setVerifyingOTP] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);

    const [timer, setTimer] = useState(60);

    const [otp, setOtp] = useState([
        "",
        "",
        "",
        "",
        "",
        "",
    ]);

    const inputRefs = useRef([]);

    const fillOtp = (digits) => {
        const nextOTP = ["", "", "", "", "", ""];

        digits
            .slice(0, 6)
            .split("")
            .forEach((digit, index) => {
                nextOTP[index] = digit;
            });

        setOtp(nextOTP);
    };

    // ==========================================
    // OTP TIMER
    // ==========================================

    useEffect(() => {
        if (step !== "otp" || timer <= 0) {
            return;
        }

        const interval = setInterval(() => {
            setTimer((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [step, timer]);

    // ==========================================
    // CLOSE WITH ESC
    // ==========================================

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    // ==========================================
    // OTP INPUT
    // ==========================================

    const handleOTPChange = (value, index) => {
        const digits = value.replace(/\D/g, "");

        if (!digits) {
            setOtp((prev) => {
                const next = [...prev];
                next[index] = "";
                return next;
            });
            return;
        }

        if (digits.length >= 6) {
            fillOtp(digits);
            inputRefs.current[5]?.focus();
            return;
        }

        if (digits.length > 1) {
            setOtp((prev) => {
                const next = [...prev];

                digits.split("").forEach((digit, offset) => {
                    if (index + offset < next.length) {
                        next[index + offset] = digit;
                    }
                });

                return next;
            });

            inputRefs.current[
                Math.min(index + digits.length, 5)
            ]?.focus();
            return;
        }

        setOtp((prev) => {
            const next = [...prev];
            next[index] = digits;
            return next;
        });

        if (index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOTPPaste = (event, index) => {
        const pastedValue = event.clipboardData
            .getData("text")
            .replace(/\D/g, "");

        if (!pastedValue) return;

        event.preventDefault();

        if (pastedValue.length >= 6) {
            fillOtp(pastedValue);
            inputRefs.current[5]?.focus();
            return;
        }

        setOtp((prev) => {
            const next = [...prev];

            pastedValue.split("").forEach((digit, offset) => {
                if (index + offset < next.length) {
                    next[index + offset] = digit;
                }
            });

            return next;
        });

        inputRefs.current[
            Math.min(index + pastedValue.length - 1, 5)
        ]?.focus();
    };

    // ==========================================
    // SEND OTP
    // ==========================================

    const sendOTP = async () => {
        if (loading) return;

        if (!email.trim()) {
            setMessage("Please enter your email.");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            const res = await AuthAPI.forgotPassword(
                email.trim().toLowerCase()
            );

            setOtp(["", "", "", "", "", ""]);
            setTimer(60);

            setMessage(res.data.message);
            setStep("otp");

            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to send OTP"
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // VERIFY OTP
    // ==========================================

    const verifyOTP = async () => {
        if (verifyingOTP) return;

        const code = otp.join("");

        if (code.length !== 6) {
            setMessage("Enter complete OTP");
            return;
        }

        try {
            setVerifyingOTP(true);
            setMessage("");

            const res = await AuthAPI.verifyResetOTP(
                email.trim().toLowerCase(),
                code
            );

            setMessage(res.data.message);

            setStep("password");
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Invalid or expired OTP"
            );
        } finally {
            setVerifyingOTP(false);
        }
    };

    // ==========================================
    // RESET PASSWORD
    // ==========================================

    const resetPassword = async (e) => {
        e.preventDefault();

        if (resettingPassword) return;

        if (!password || !confirmPassword) {
            setMessage("Please enter your new password.");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match");
            return;
        }

        try {
            setResettingPassword(true);
            setMessage("");

            const res = await AuthAPI.resetPassword(
                email.trim().toLowerCase(),
                otp.join(""),
                password
            );

            setMessage(res.data.message);

            setStep("success");
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Something went wrong"
            );
        } finally {
            setResettingPassword(false);
        }
    };

    // ==========================================
    // MODAL
    // ==========================================

    return (
        <div
            className="
                fixed
                inset-0
                z-[100]
                flex
                items-center
                justify-center
                bg-black/70
                p-4
                backdrop-blur-sm
            "
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="
                    relative
                    w-full
                    max-w-[430px]
                    overflow-hidden
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#17131f]
                    shadow-2xl
                    shadow-violet-950/40
                "
            >
                {/* ==========================================
                    CLOSE
                =========================================== */}

                <button
                    type="button"
                    onClick={onClose}
                    className="
                        absolute
                        right-4
                        top-4
                        z-10
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-full
                        bg-white/5
                        text-lg
                        text-white/50
                        transition
                        hover:bg-white/10
                        hover:text-white
                    "
                >
                    ×
                </button>

                <div className="px-7 py-8 sm:px-9">

                    {/* ==========================================
                        EMAIL STEP
                    =========================================== */}

                    {step === "email" && (
                        <>
                            <div className="pr-8">
                                <p
                                    className="
                                        text-xs
                                        font-medium
                                        uppercase
                                        tracking-[0.18em]
                                        text-[#9b7cff]
                                    "
                                >
                                    Account recovery
                                </p>

                                <h2
                                    className="
                                        mt-3
                                        text-2xl
                                        font-semibold
                                        tracking-tight
                                        text-white
                                    "
                                >
                                    Forgot password?
                                </h2>

                                <p
                                    className="
                                        mt-2
                                        text-sm
                                        leading-6
                                        text-[#91899d]
                                    "
                                >
                                    Enter your email and we'll send
                                    you a verification code.
                                </p>
                            </div>

                            {message && (
                                <div
                                    className="
                                        mt-5
                                        rounded-lg
                                        border
                                        border-[#574a70]
                                        bg-[#372f47]
                                        px-4
                                        py-3
                                        text-sm
                                        text-[#c4b3ff]
                                    "
                                >
                                    {message}
                                </div>
                            )}

                            <div className="mt-7">

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            sendOTP();
                                        }
                                    }}
                                    placeholder="Email"
                                    autoComplete="email"
                                    autoFocus
                                    className="
                                        w-full
                                        rounded-lg
                                        border
                                        border-transparent
                                        bg-[#3b3449]
                                        px-5
                                        py-4
                                        text-white
                                        outline-none
                                        transition
                                        placeholder:text-[#8e879b]
                                        focus:border-[#8b6cff]
                                        focus:ring-1
                                        focus:ring-[#8b6cff]
                                    "
                                />

                                <button
                                    type="button"
                                    onClick={sendOTP}
                                    disabled={loading}
                                    className="
                                        mt-4
                                        w-full
                                        rounded-lg
                                        bg-[#7656d1]
                                        py-4
                                        font-medium
                                        text-white
                                        transition
                                        hover:bg-[#8565df]
                                        disabled:cursor-not-allowed
                                        disabled:opacity-50
                                    "
                                >
                                    {loading
                                        ? "Sending..."
                                        : "Send OTP"}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ==========================================
                        OTP STEP
                    =========================================== */}

                    {step === "otp" && (
                        <>
                            <div className="pr-8">
                                <p
                                    className="
                                        text-xs
                                        font-medium
                                        uppercase
                                        tracking-[0.18em]
                                        text-[#9b7cff]
                                    "
                                >
                                    Verification
                                </p>

                                <h2
                                    className="
                                        mt-3
                                        text-2xl
                                        font-semibold
                                        tracking-tight
                                        text-white
                                    "
                                >
                                    Check your email
                                </h2>

                                <p
                                    className="
                                        mt-2
                                        text-sm
                                        leading-6
                                        text-[#91899d]
                                    "
                                >
                                    Enter the 6-digit code sent to
                                </p>

                                <p
                                    className="
                                        mt-1
                                        truncate
                                        text-sm
                                        font-medium
                                        text-[#c4b3ff]
                                    "
                                >
                                    {email}
                                </p>
                            </div>

                            {message && (
                                <div
                                    className="
                                        mt-5
                                        rounded-lg
                                        border
                                        border-[#574a70]
                                        bg-[#372f47]
                                        px-4
                                        py-3
                                        text-sm
                                        text-[#c4b3ff]
                                    "
                                >
                                    {message}
                                </div>
                            )}

                            {/* OTP INPUTS */}

                            <div
                                className="
                                    mt-7
                                    flex
                                    justify-between
                                    gap-2
                                "
                            >
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => {
                                            inputRefs.current[index] =
                                                el;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) =>
                                            handleOTPChange(
                                                e.target.value,
                                                index
                                            )
                                        }
                                        onPaste={(e) =>
                                            handleOTPPaste(
                                                e,
                                                index
                                            )
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key ===
                                                "Backspace" &&
                                                index > 0
                                            ) {
                                                setOtp((prev) => {
                                                    const next = [
                                                        ...prev,
                                                    ];

                                                    if (next[index]) {
                                                        next[index] = "";
                                                        return next;
                                                    }

                                                    next[index - 1] = "";
                                                    return next;
                                                });

                                                if (!otp[index]) {
                                                    inputRefs.current[
                                                        index - 1
                                                    ]?.focus();
                                                }
                                            }

                                            if (
                                                e.key ===
                                                "ArrowLeft" &&
                                                index > 0
                                            ) {
                                                inputRefs.current[
                                                    index - 1
                                                ]?.focus();
                                            }

                                            if (
                                                e.key ===
                                                "ArrowRight" &&
                                                index < 5
                                            ) {
                                                inputRefs.current[
                                                    index + 1
                                                ]?.focus();
                                            }

                                            if (
                                                e.key === "Enter" &&
                                                otp.join("").length ===
                                                6
                                            ) {
                                                verifyOTP();
                                            }
                                        }}
                                        className="
                                            h-12
                                            min-w-0
                                            flex-1
                                            rounded-lg
                                            border
                                            border-white/10
                                            bg-[#3b3449]
                                            text-center
                                            text-lg
                                            font-semibold
                                            text-white
                                            outline-none
                                            transition
                                            focus:border-[#8b6cff]
                                            focus:ring-1
                                            focus:ring-[#8b6cff]
                                        "
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={verifyOTP}
                                disabled={verifyingOTP}
                                className="
                                    mt-5
                                    w-full
                                    rounded-lg
                                    bg-[#7656d1]
                                    py-4
                                    font-medium
                                    text-white
                                    transition
                                    hover:bg-[#8565df]
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                {verifyingOTP
                                    ? "Verifying..."
                                    : "Verify OTP"}
                            </button>

                            <div
                                className="
                                    mt-5
                                    text-center
                                    text-sm
                                    text-[#81798c]
                                "
                            >
                                {timer > 0 ? (
                                    <span>
                                        Resend code in {timer}s
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={sendOTP}
                                        disabled={loading}
                                        className="
                                            text-[#b69cff]
                                            transition
                                            hover:text-white
                                            disabled:opacity-50
                                        "
                                    >
                                        {loading
                                            ? "Sending..."
                                            : "Resend OTP"}
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep("email");
                                    setMessage("");
                                }}
                                className="
                                    mt-4
                                    w-full
                                    text-center
                                    text-xs
                                    text-[#81798c]
                                    transition
                                    hover:text-white
                                "
                            >
                                Change email
                            </button>
                        </>
                    )}

                    {/* ==========================================
                        PASSWORD STEP
                    =========================================== */}

                    {step === "password" && (
                        <form onSubmit={resetPassword}>

                            <div className="pr-8">
                                <p
                                    className="
                                        text-xs
                                        font-medium
                                        uppercase
                                        tracking-[0.18em]
                                        text-[#9b7cff]
                                    "
                                >
                                    New password
                                </p>

                                <h2
                                    className="
                                        mt-3
                                        text-2xl
                                        font-semibold
                                        tracking-tight
                                        text-white
                                    "
                                >
                                    Reset your password
                                </h2>

                                <p
                                    className="
                                        mt-2
                                        text-sm
                                        leading-6
                                        text-[#91899d]
                                    "
                                >
                                    Choose a new password for your
                                    CodeGPM account.
                                </p>
                            </div>

                            {message && (
                                <div
                                    className="
                                        mt-5
                                        rounded-lg
                                        border
                                        border-[#574a70]
                                        bg-[#372f47]
                                        px-4
                                        py-3
                                        text-sm
                                        text-[#c4b3ff]
                                    "
                                >
                                    {message}
                                </div>
                            )}

                            <div className="mt-7 space-y-4">

                                <PasswordInput
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(
                                            e.target.value
                                        )
                                    }
                                    placeholder="New password"
                                    autoComplete="new-password"
                                    className="
                                        w-full
                                        rounded-lg
                                        border
                                        border-transparent
                                        bg-[#3b3449]
                                        px-5
                                        py-4
                                        text-white
                                        outline-none
                                        transition
                                        placeholder:text-[#8e879b]
                                        focus:border-[#8b6cff]
                                        focus:ring-1
                                        focus:ring-[#8b6cff]
                                    "
                                />

                                <PasswordInput
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Confirm password"
                                    autoComplete="new-password"
                                    className="
                                        w-full
                                        rounded-lg
                                        border
                                        border-transparent
                                        bg-[#3b3449]
                                        px-5
                                        py-4
                                        text-white
                                        outline-none
                                        transition
                                        placeholder:text-[#8e879b]
                                        focus:border-[#8b6cff]
                                        focus:ring-1
                                        focus:ring-[#8b6cff]
                                    "
                                />

                            </div>

                            <button
                                type="submit"
                                disabled={resettingPassword}
                                className="
                                    mt-5
                                    w-full
                                    rounded-lg
                                    bg-[#7656d1]
                                    py-4
                                    font-medium
                                    text-white
                                    transition
                                    hover:bg-[#8565df]
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                {resettingPassword
                                    ? "Resetting..."
                                    : "Reset Password"}
                            </button>
                        </form>
                    )}

                    {/* ==========================================
                        SUCCESS
                    =========================================== */}

                    {step === "success" && (
                        <div className="py-4 text-center">

                            <div
                                className="
                                    mx-auto
                                    flex
                                    h-12
                                    w-12
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-[#7656d1]/15
                                    text-xl
                                    text-[#b69cff]
                                "
                            >
                                ✓
                            </div>

                            <h2
                                className="
                                    mt-5
                                    text-2xl
                                    font-semibold
                                    text-white
                                "
                            >
                                Password reset
                            </h2>

                            <p
                                className="
                                    mt-2
                                    text-sm
                                    leading-6
                                    text-[#91899d]
                                "
                            >
                                Your password has been changed
                                successfully. You can now sign in
                                with your new password.
                            </p>

                            <button
                                type="button"
                                onClick={onClose}
                                className="
                                    mt-7
                                    w-full
                                    rounded-lg
                                    bg-[#7656d1]
                                    py-4
                                    font-medium
                                    text-white
                                    transition
                                    hover:bg-[#8565df]
                                "
                            >
                                Back to login
                            </button>

                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

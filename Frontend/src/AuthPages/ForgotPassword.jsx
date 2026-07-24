import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/auth";

export default function ForgotPassword() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");

    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);

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

    // OTP Timer
    useEffect(() => {
        if (!showOTPModal || timer <= 0) {
            return;
        }

        const interval = setInterval(() => {
            setTimer((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [showOTPModal, timer]);

    // OTP Input
    const handleOTPChange = (value, index) => {
        if (!/^[0-9]?$/.test(value)) return;

        const newOTP = [...otp];

        newOTP[index] = value;

        setOtp(newOTP);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Send OTP
    const sendOTP = async () => {
        if (loading) return;

        if (!email.trim()) {
            setMessage("Please enter your email.");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            const res = await API.post("/forgot-password", {
                email: email.trim(),
            });

            setMessage(res.data.message);

            // Reset old OTP
            setOtp(["", "", "", "", "", ""]);

            setTimer(60);
            setShowOTPModal(true);

            // Focus first OTP box
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

    // Verify OTP
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

            const res = await API.post("/verify-reset-otp", {
                email: email.trim(),
                code,
            });

            setMessage(res.data.message);

            setOtpVerified(true);
            setShowOTPModal(false);

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Invalid or expired OTP"
            );
        } finally {
            setVerifyingOTP(false);
        }
    };

    // Reset Password
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

            const res = await API.post("/reset-password", {
                email: email.trim(),
                code: otp.join(""),
                password,
            });

            setMessage(res.data.message);

            setTimeout(() => {
                navigate("/dashboard");
            }, 1200);

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Something went wrong"
            );
        } finally {
            setResettingPassword(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">

            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">

                <h2 className="text-3xl font-bold text-center mb-6">
                    Forgot Password
                </h2>

                {/* Message */}
                {message && (
                    <p className="text-center text-sm text-violet-600 mb-4">
                        {message}
                    </p>
                )}

                <form
                    onSubmit={resetPassword}
                    className="space-y-4"
                >

                    {/* Email */}
                    <div>

                        <label className="block mb-2">
                            Email
                        </label>

                        <div className="flex gap-2">

                            <input
                                type="email"
                                value={email}
                                disabled={otpVerified}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border rounded-lg p-3 flex-1 outline-none disabled:bg-gray-100"
                                placeholder="Enter your email"
                            />

                            {!otpVerified ? (
                                <button
                                    type="button"
                                    onClick={sendOTP}
                                    disabled={loading}
                                    className="bg-violet-600 text-white px-4 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading
                                        ? "Sending..."
                                        : "Send OTP"}
                                </button>
                            ) : (
                                <div className="flex items-center px-4 text-green-600 font-semibold">
                                    ✓ Verified
                                </div>
                            )}

                        </div>

                    </div>

                    {/* Password Fields */}
                    {otpVerified && (
                        <>

                            <div>

                                <label className="block mb-2">
                                    New Password
                                </label>

                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className="border rounded-lg p-3 w-full outline-none"
                                    placeholder="New Password"
                                />

                            </div>

                            <div>

                                <label className="block mb-2">
                                    Confirm Password
                                </label>

                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    className="border rounded-lg p-3 w-full outline-none"
                                    placeholder="Confirm Password"
                                />

                            </div>

                            <button
                                type="submit"
                                disabled={resettingPassword}
                                className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {resettingPassword
                                    ? "Resetting..."
                                    : "Reset Password"}
                            </button>

                        </>
                    )}

                </form>

                {/* OTP Modal */}
                {showOTPModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

                        <div className="bg-white rounded-xl p-6 w-full max-w-sm">

                            <h3 className="text-2xl font-bold text-center mb-2">
                                Verify OTP
                            </h3>

                            <p className="text-center text-gray-500 mb-6">
                                Enter the 6-digit code sent to your email
                            </p>

                            {/* OTP Inputs */}
                            <div className="flex justify-center gap-2 mb-6">

                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) =>
                                            (inputRefs.current[index] = el)
                                        }
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
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Backspace" &&
                                                !otp[index] &&
                                                index > 0
                                            ) {
                                                inputRefs.current[
                                                    index - 1
                                                ]?.focus();
                                            }
                                        }}
                                        className="w-12 h-12 text-center border rounded-lg text-xl outline-none focus:border-violet-600"
                                    />
                                ))}

                            </div>

                            {/* Verify */}
                            <button
                                type="button"
                                onClick={verifyOTP}
                                disabled={verifyingOTP}
                                className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {verifyingOTP
                                    ? "Verifying..."
                                    : "Verify OTP"}
                            </button>

                            {/* Resend */}
                            <div className="text-center mt-4">

                                {timer > 0 ? (
                                    <p className="text-gray-500">
                                        Resend OTP in {timer}s
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={sendOTP}
                                        disabled={loading}
                                        className="text-violet-600 hover:underline disabled:opacity-50"
                                    >
                                        {loading
                                            ? "Sending..."
                                            : "Resend OTP"}
                                    </button>
                                )}

                            </div>

                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}
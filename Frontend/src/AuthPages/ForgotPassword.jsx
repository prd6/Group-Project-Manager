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

    useEffect(() => {

        let interval;

        if (showOTPModal && timer > 0) {

            interval = setInterval(() => {

                setTimer((prev) => prev - 1);

            },1000);

        }

        return ()=>clearInterval(interval);

    },[showOTPModal,timer]);

    const handleOTPChange=(value,index)=>{

        if(!/^[0-9]?$/.test(value)) return;

        const newOTP=[...otp];

        newOTP[index]=value;

        setOtp(newOTP);

        if(value && index<5){

            inputRefs.current[index+1]?.focus();

        }

    };

    const sendOTP=async()=>{

        if(!email){

            setMessage("Please enter your email.");

            return;

        }

        try{

            setLoading(true);

            const res=await API.post("/forgot-password",{

                email,

            });

            setMessage(res.data.message);

            setTimer(60);

            setShowOTPModal(true);

        }catch(error){

            setMessage(error.response?.data?.message || "Failed to send OTP");

        }finally{

            setLoading(false);

        }

    };

    const verifyOTP=async()=>{

        const code=otp.join("");

        if(code.length!==6){

            setMessage("Enter complete OTP");

            return;

        }

        try{

            const res=await API.post("/verify-reset-otp",{

                email,

                code,

            });

            setMessage(res.data.message);

            setOtpVerified(true);

            setShowOTPModal(false);

        }catch(error){

            setMessage(error.response?.data?.message || "Invalid OTP");

        }

    };

    const resetPassword=async(e)=>{

        e.preventDefault();

        if(password!==confirmPassword){

            setMessage("Passwords do not match");

            return;

        }

        try{

            const res=await API.post("/reset-password",{

                email,

                code:otp.join(""),

                password,

            });

            setMessage(res.data.message);

            setTimeout(()=>{

                navigate("/login");

            },1200);

        }catch(error){

            setMessage(error.response?.data?.message || "Something went wrong");

        }

    };

return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">

        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">

            <h2 className="text-3xl font-bold text-center mb-6">
                Forgot Password
            </h2>

            {message && (
                <p className="text-center text-sm text-violet-600 mb-4">
                    {message}
                </p>
            )}

            <form
                onSubmit={resetPassword}
                className="space-y-4"
            >

                <div>

                    <label className="block mb-2">
                        Email
                    </label>

                    <div className="flex gap-2">

                        <input
                            type="email"
                            value={email}
                            disabled={otpVerified}
                            onChange={(e)=>setEmail(e.target.value)}
                            className="border rounded-lg p-3 flex-1 outline-none"
                            placeholder="Enter your email"
                        />

                        {!otpVerified ? (
                            <button
                                type="button"
                                onClick={sendOTP}
                                disabled={loading}
                                className="bg-violet-600 text-white px-4 rounded-lg hover:bg-violet-700"
                            >
                                {loading ? "Sending..." : "Send OTP"}
                            </button>
                        ) : (
                            <div className="flex items-center px-4 text-green-600 font-semibold">
                                ✓ Verified
                            </div>
                        )}

                    </div>

                </div>

                {otpVerified && (

                    <>

                        <div>

                            <label className="block mb-2">
                                New Password
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(e)=>setPassword(e.target.value)}
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
                                onChange={(e)=>setConfirmPassword(e.target.value)}
                                className="border rounded-lg p-3 w-full outline-none"
                                placeholder="Confirm Password"
                            />

                        </div>

                        <button
                            type="submit"
                            className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700"
                        >
                            Reset Password
                        </button>

                    </>

                )}


            </form>

                        {showOTPModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

                    <div className="bg-white rounded-xl p-6 w-full max-w-sm">

                        <h3 className="text-2xl font-bold text-center mb-2">
                            Verify OTP
                        </h3>

                        <p className="text-center text-gray-500 mb-6">
                            Enter the 6-digit code sent to your email
                        </p>

                        <div className="flex justify-center gap-2 mb-6">

                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) =>
                                        handleOTPChange(e.target.value, index)
                                    }
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === "Backspace" &&
                                            !otp[index] &&
                                            index > 0
                                        ) {
                                            inputRefs.current[index - 1]?.focus();
                                        }
                                    }}
                                    className="w-12 h-12 text-center border rounded-lg text-xl outline-none focus:border-violet-600"
                                />
                            ))}

                        </div>

                        <button
                            onClick={verifyOTP}
                            className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700"
                        >
                            Verify OTP
                        </button>

                        <div className="text-center mt-4">

                            {timer > 0 ? (
                                <p className="text-gray-500">
                                    Resend OTP in {timer}s
                                </p>
                            ) : (
                                <button
                                    onClick={sendOTP}
                                    className="text-violet-600 hover:underline"
                                >
                                    Resend OTP
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
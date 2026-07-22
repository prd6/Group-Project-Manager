import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/auth";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");

  const [showOTPModal, setShowOTPModal] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);

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
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [showOTPModal, timer]);

  const handleOTPChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOTP = [...otp];
    newOTP[index] = value;
    setOtp(newOTP);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const sendOTP = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setMessage("Please fill all fields first.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      setSendingOTP(true);

      const res = await API.post("/send-otp", {
        email,
      });

      setMessage(res.data.message);

      setTimer(60);
      setShowOTPModal(true);

    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to send OTP"
      );
    } finally {
      setSendingOTP(false);
    }
  };

  const verifyOTP = async () => {
    const code = otp.join("");

    if (code.length !== 6) {
      setMessage("Enter the complete OTP.");
      return;
    }

    try {
      setVerifyingOTP(true);

      const res = await API.post("/verify-otp", {
        email,
        code,
      });

      setMessage(res.data.message);

      setEmailVerified(true);
      setShowOTPModal(false);

    } catch (error) {
      setMessage(
        error.response?.data?.message || "Invalid OTP"
      );
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!emailVerified) {
      setMessage("Please verify your email first.");
      return;
    }

    try {
      const res = await API.post("/signup", {
        name,
        email,
        password,
      });

      setMessage(res.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1200);

    } catch (error) {
      setMessage(
        error.response?.data?.message || "Something went wrong"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8">

        <h1 className="text-3xl font-bold text-center">
          Create Account
        </h1>

        <p className="text-gray-500 text-center mt-2">
          Sign up to get started
        </p>

        {message && (
          <div className="mt-5 text-center text-violet-600 font-medium">
            {message}
          </div>
        )}

        <form
          onSubmit={handleSignup}
          className="space-y-5 mt-8"
        >

          {/* Name */}

          <div>
            <label className="block mb-2 text-gray-700">
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full border border-gray-400 rounded-lg px-4 py-3 focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          {/* Email */}

          <div>

            <label className="block mb-2 text-gray-700">
              Email
            </label>

            <div className="flex gap-2">

              <input
                type="email"
                value={email}
                disabled={emailVerified}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 border border-gray-400 rounded-lg px-4 py-3 focus:ring-2 focus:ring-violet-500 outline-none disabled:bg-gray-100"
              />

              {!emailVerified ? (

                <button
                  type="button"
                  onClick={sendOTP}
                  disabled={sendingOTP}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-4 rounded-lg"
                >
                  {sendingOTP ? "Sending..." : "Verify"}
                </button>

              ) : (

                <div className="flex items-center px-4 rounded-lg bg-green-100 text-green-700 font-semibold">
                  ✓ Verified
                </div>

              )}

            </div>

          </div>

          {/* Password */}

          <div>

            <label className="block mb-2 text-gray-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password"
              className="w-full border border-gray-400 rounded-lg px-4 py-3 focus:ring-2 focus:ring-violet-500 outline-none"
            />

          </div>

          {/* Confirm Password */}

          <div>

            <label className="block mb-2 text-gray-700">
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full border border-gray-400 rounded-lg px-4 py-3 focus:ring-2 focus:ring-violet-500 outline-none"
            />

          </div>

          <button
            type="submit"
            disabled={!emailVerified}
            className={`w-full py-3 rounded-lg text-white font-semibold transition

          ${emailVerified
                ? "bg-violet-600 hover:bg-violet-700"
                : "bg-gray-400 cursor-not-allowed"
              }`}
          >
            Create Account
          </button>

        </form>

        <p className="text-center text-gray-500 mt-6">

          Already have an account?{" "}

          <Link
            to="/login"
            className="text-violet-600 font-semibold"
          >
            Login
          </Link>

        </p>

        {/* OTP Modal Starts Here */}
        {showOTPModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

            <div className="bg-white rounded-2xl w-[90%] max-w-md p-8 shadow-2xl relative">

              {/* Close Button */}

              <button
                type="button"
                onClick={() => setShowOTPModal(false)}
                className="absolute right-4 top-3 text-2xl text-gray-500 hover:text-black"
              >
                ×
              </button>

              <h2 className="text-2xl font-bold text-center">
                Verify Email
              </h2>

              <p className="text-center text-gray-500 mt-2">
                We've sent a 6-digit verification code to
              </p>

              <p className="text-center font-semibold text-violet-600 mt-1">
                {email}
              </p>

              {/* OTP Boxes */}

              <div className="flex justify-between gap-2 mt-8">

                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
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
                    className="w-12 h-14 text-center text-2xl border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                ))}

              </div>

              <button
                type="button"
                onClick={verifyOTP}
                disabled={verifyingOTP}
                className="w-full mt-8 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-semibold"
              >
                {verifyingOTP ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                disabled={timer > 0}
                onClick={sendOTP}
                className="w-full mt-4 text-violet-600 font-semibold disabled:text-gray-400"
              >
                {timer > 0
                  ? `Resend OTP in ${timer}s`
                  : "Resend OTP"}
              </button>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthAPI from "../services/auth";
import Hyperspeed from "../Styles/Hyperspeed";
import BackButton from "../Components/BackButton";
import PasswordInput from "../Components/PasswordInput";

export default function Signup() {
  const navigate = useNavigate();
  const normalizeEmail = (value) =>
    value.trim().toLowerCase();

  // ================= HYPERSPEED OPTIONS =================

  const hyperspeedOptions = useMemo(
    () => ({
      distortion: "turbulentDistortion",
      length: 400,
      roadWidth: 10,
      islandWidth: 2,
      lanesPerRoad: 4,

      fov: 90,
      fovSpeedUp: 150,
      speedUp: 2,

      carLightsFade: 0.4,
      totalSideLightSticks: 20,
      lightPairsPerRoadWay: 40,

      shoulderLinesWidthPercentage: 0.05,
      brokenLinesWidthPercentage: 0.1,
      brokenLinesLengthPercentage: 0.5,

      lightStickWidth: [0.12, 0.5],
      lightStickHeight: [1.3, 1.7],

      movingAwaySpeed: [60, 80],
      movingCloserSpeed: [-120, -160],

      carLightsLength: [12, 80],
      carLightsRadius: [0.05, 0.14],

      carWidthPercentage: [0.3, 0.5],
      carShiftX: [-0.8, 0.8],
      carFloorSeparation: [0, 5],

      colors: {
        roadColor: 0x080808,
        islandColor: 0x0a0a0a,
        background: 0x000000,

        shoulderLines: 0xffffff,
        brokenLines: 0xffffff,

        leftCars: [
          0xd856bf,
          0x6750a2,
          0xc247ac,
        ],

        rightCars: [
          0x03b3c3,
          0x0e5ea5,
          0x324555,
        ],

        sticks: 0x03b3c3,
      },
    }),
    []
  );

  // ================= FORM STATE =================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");

  // ================= OTP STATE =================

  const [showOTPModal, setShowOTPModal] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

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
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "Build Together,\nShip Better",
      description: "Manage projects. Collaborate with your team.",
    },
    {
      title: "Stay Connected,\nMove Faster",
      description: "Keep your entire team aligned in one workspace.",
    },
    {
      title: "Turn Ideas,\nInto Reality",
      description: "Plan, build and deliver projects together.",
    },
  ];

  const inputRefs = useRef([]);

  const fillOtp = (digits) => {
    const nextOtp = ["", "", "", "", "", ""];

    digits
      .slice(0, 6)
      .split("")
      .forEach((digit, index) => {
        nextOtp[index] = digit;
      });

    setOtp(nextOtp);
  };

  // ================= OTP TIMER =================

  useEffect(() => {
    let interval;

    if (showOTPModal && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [showOTPModal, timer]);

  // ================= AUTO SLIDER =================

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(slideInterval);
  }, [slides.length]);

  // ================= OTP INPUT =================

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

  // ================= SEND OTP =================

  const sendOTP = async () => {
    if (sendingOTP) return;

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
      setMessage("");

      const normalizedEmail = normalizeEmail(email);

      const res = await AuthAPI.sendOTP(normalizedEmail);

      setMessage(res.data.message);
      setEmail(normalizedEmail);
      setOtpEmail(normalizedEmail);
      setEmailVerified(false);

      setTimer(60);

      setOtp(["", "", "", "", "", ""]);

      setShowOTPModal(true);
    } catch (error) {
      console.error("SEND OTP ERROR:", error);
      console.error("STATUS:", error.response?.status);
      console.error("RESPONSE:", error.response?.data);

      setMessage(
        error.response?.data?.message ||
        "Failed to send OTP"
      );
    } finally {
      setSendingOTP(false);
    }
  };

  // ================= VERIFY OTP =================

const verifyOTP = async () => {
  const code = otp.join("");
  const verificationEmail =
    otpEmail || normalizeEmail(email);

  if (code.length !== 6) {
    setMessage("Enter the complete OTP.");
    return;
  }

  try {
    setVerifyingOTP(true);
    setMessage("");

    // Verify OTP
    const res = await AuthAPI.verifyOTP(
      verificationEmail,
      code
    );

    setMessage(res.data.message);

    // Create account
    await AuthAPI.signup({
      name,
      email: verificationEmail,
      password,
    });

    // Auto login
    const loginRes = await AuthAPI.login({
      email: verificationEmail,
      password,
    });

    localStorage.setItem(
      "token",
      loginRes.data.token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(loginRes.data.user)
    );

    window.dispatchEvent(
      new CustomEvent("user-updated", {
        detail: loginRes.data.user,
      })
    );

    setEmailVerified(true);
    setShowOTPModal(false);

    navigate("/dashboard", {
      replace: true,
    });

  } catch (error) {
    setMessage(
      error.response?.data?.message ||
      "Invalid OTP"
    );
  } finally {
    setVerifyingOTP(false);
  }
};

    // ================= SIGNUP =================

    const handleSignup = async (e) => {
      e.preventDefault();

      if (emailVerified) return;

      await sendOTP();
    };

    return (
      <div
        className="
        relative
        min-h-screen
        w-screen
        bg-black
        flex
        items-center
        justify-start
        p-4
        md:p-0
      "
      >
        <div className="absolute left-7 top-7 z-10">
          <BackButton to="/" label="Home" />
        </div>
        {/* ==================================================
                         MAIN CONTAINER
      ================================================== */}

        <div
          className="
          w-full
          min-h-full
          bg-gray-950/10
          shadow-black/20
          shadow-2xl
          overflow-hidden
          flex
        "
        >
          {/* ==================================================
                           LEFT SIDE
        ================================================== */}

          <div className="hidden lg:block w-1/2">
            <div
              className="
              relative
              flex
              h-screen
              flex-col
              justify-between
              w-full
              overflow-hidden
              border border-[#222]
              bg-[#121212]
              p-8
            "
            >

              <div className="absolute inset-0 z-0">
                <Hyperspeed
                  effectOptions={hyperspeedOptions}
                />
              </div>
              <div className="space-y-6">

                <div className="max-w-lg space-y-4 mt-20">
                  <h2 className="text-4xl font-semibold leading-tight text-white">
                    Build together, keep the momentum.
                  </h2>

                </div>
              </div>

              {/* BACK BUTTON */}


              {/* BOTTOM CAROUSEL */}
              <div
                className="
    absolute
    bottom-14
    left-0
    right-0
    z-10
    px-8
    overflow-hidden
  "
              >
                {/* Slides viewport */}
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{
                      transform: `translateX(-${activeSlide * 100}%)`,
                    }}
                  >
                    {slides.map((slide, index) => (
                      <div
                        key={index}
                        className="min-w-full text-center px-2"
                      >
                        <h3 className="text-white text-3xl font-semibold leading-tight drop-shadow-lg whitespace-pre-line">
                          {slide.title}
                        </h3>

                        <p className="text-white/60 text-sm mt-4">
                          {slide.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Slide controls */}
                <div className="flex justify-center items-center gap-3 mt-8">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                      className={`
          h-1.5 
          rounded-full
          transition-all
          duration-300
          ${activeSlide === index
                          ? "w-10 bg-white"
                          : "w-8 bg-white/30 hover:bg-white/60"
                        }
        `}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
                           RIGHT SIDE
        ================================================== */}

          <div
            className="
            flex-1

            flex
            items-center
            justify-center

            px-6
            py-12

            sm:px-10
            md:px-16
            lg:px-20
          "
          >
            <div className="w-full max-w-[470px]">
              {/* MOBILE LOGO */}

              <Link
                to="/"
                className="
                lg:hidden
                inline-block
                text-white
                text-2xl
                font-bold
                mb-10
              "
              >
                CodeGPM
              </Link>

              {/* TITLE */}

              <h1
                className="
                text-white
                text-4xl
                md:text-5xl
                font-medium
                tracking-tight
              "
              >
                Create an account
              </h1>

              <p className="mt-4 text-sm text-gray-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-white underline decoration-white/30 transition hover:text-gray-300"
                >
                  Log in
                </Link>
              </p>

              {/* MESSAGE */}

              {message && (
                <div className="mt-5 rounded-lg border border-[#222] bg-[#1b1b1b] px-4 py-3 text-sm text-gray-300">
                  {message}
                </div>
              )}

              {/* ==================================================
                              FORM
            ================================================== */}

              <form
                onSubmit={handleSignup}
                className="mt-8 space-y-4"
              >
                {/* NAME */}

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Full name"
                  className="w-full rounded-xl border border-transparent bg-black/20 px-5 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-white/20 focus:bg-[#1b1b1b]"
                />

                {/* EMAIL + VERIFY */}

                <div className="flex gap-3">
                  <input
                    type="email"
                    value={email}
                    disabled={
                      emailVerified
                    }
                    onChange={(e) => {
                      const nextEmail = e.target.value;

                      setEmail(nextEmail);

                      if (
                        otpEmail &&
                        normalizeEmail(nextEmail) !== otpEmail
                      ) {
                        setOtpEmail("");
                        setOtp([
                          "",
                          "",
                          "",
                          "",
                          "",
                          "",
                        ]);
                      }
                    }}
                    placeholder="Email"
                    className="min-w-0 flex-1 rounded-xl border border-transparent bg-black/20 px-5 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-white/20 focus:bg-[#1b1b1b] disabled:opacity-60"
                  />

                </div>

                {/* PASSWORD */}

                <PasswordInput
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  className="
                  w-full

                  bg-black/20

                  border
                  border-transparent

                  text-white

                  placeholder:text-gray-600

                  rounded-lg

                  px-5
                  py-4

                  outline-none

                  transition

                  focus:border-white/20
                  focus:ring-1
                  focus:ring-0
                "
                />

                {/* CONFIRM PASSWORD */}

                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className="
                  w-full

                  bg-black/20

                  border
                  border-transparent

                  text-white

                  placeholder:text-gray-600

                  rounded-lg

                  px-5
                  py-4

                  outline-none

                  transition

                  focus:border-white/20
                  focus:ring-1
                  focus:ring-0
                "
                />

                {/* CREATE ACCOUNT */}

                <button
                  type="submit"
                  disabled={sendingOTP}
                  className="
    w-full
    py-4
    mt-2
    rounded-lg
    bg-white
    text-black
    font-medium
    transition
    hover:bg-gray-200
    disabled:opacity-50
    disabled:cursor-not-allowed
"
                >
                  {sendingOTP ? "Sending OTP..." : "Create account"}
                </button>
              </form>

              {/* DIVIDER */}

              <div
                className="
                flex
                items-center
                gap-4
                my-7
              "
              >
                <div className="h-px bg-[#222] flex-1" />

                <span
                  className="
                  text-gray-500
                  text-xs
                  whitespace-nowrap
                "
                >
                  Create your workspace
                </span>

                <div className="h-px bg-[#222] flex-1" />
              </div>

              <p
                className="
                text-center
                text-xs
                text-gray-500
              "
              >
                By creating an account, you agree to use
                CodeGPM responsibly.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
                         OTP MODAL
      ================================================== */}

        {showOTPModal && (
          <div
            className="
            fixed
            inset-0

            bg-black/70
            

            flex
            items-center
            justify-center

            z-50

            px-4
          "
          >
            <div
              className="
              relative

              w-full
              max-w-md

              bg-[#121212]

              border
              border-[#222]

              rounded-2xl

              p-8

              shadow-2xl
            "
            >
              {/* CLOSE */}

              <button
                type="button"
                onClick={() =>
                  setShowOTPModal(false)
                }
                className="
                absolute
                top-4
                right-5

                text-gray-400
                hover:text-white

                text-2xl

                transition
              "
              >
                ×
              </button>

              {/* TITLE */}

              <h2
                className="
                text-2xl
                font-semibold
                text-white
                text-center
              "
              >
                Verify your email
              </h2>

              <p
                className="
                text-center
                text-gray-400
                mt-3
                text-sm
              "
              >
                We've sent a 6-digit verification code to
              </p>

              <p
                className="
                text-center
                text-white
                mt-1
                font-medium
              "
              >
                {otpEmail || email}
              </p>

              {/* OTP INPUTS */}

              <div
                className="
                flex
                justify-center
                gap-2
                sm:gap-3
                mt-8
              "
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) =>
                      (inputRefs.current[index] = el)
                    }
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) =>
                      handleOTPChange(
                        e.target.value,
                        index
                      )
                    }
                    onPaste={(e) =>
                      handleOTPPaste(e, index)
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === "Backspace" &&
                        index > 0
                      ) {
                        setOtp((prev) => {
                          const next = [...prev];

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
                        e.key === "ArrowLeft" &&
                        index > 0
                      ) {
                        inputRefs.current[
                          index - 1
                        ]?.focus();
                      }

                      if (
                        e.key === "ArrowRight" &&
                        index < 5
                      ) {
                        inputRefs.current[
                          index + 1
                        ]?.focus();
                      }
                    }}
                    className="
                    w-11
                    h-14

                    sm:w-12

                    text-center
                    text-xl
                    text-white

                    bg-black/20

                    border
                    border-white

                    rounded-lg

                    outline-none

                    focus:border-white/20
                    focus:ring-1
                    focus:ring-0
                  "
                  />
                ))}
              </div>

              {/* VERIFY OTP */}

              <button
                type="button"
                onClick={verifyOTP}
                disabled={verifyingOTP}
                className="
                w-full

                mt-8

                bg-white
                hover:bg-gray-200

                disabled:opacity-50

                text-black

                py-3.5

                rounded-lg

                font-medium

                transition
              "
              >
                {verifyingOTP
                  ? "Verifying..."
                  : "Verify OTP"}
              </button>

              {/* RESEND OTP */}

              <button
                type="button"
                disabled={timer > 0}
                onClick={sendOTP}
                className="
                w-full

                mt-4

                text-white
                text-sm
                font-medium

                disabled:text-[#696171]

                transition
              "
              >
                {timer > 0
                  ? `Resend OTP in ${timer}s`
                  : "Resend OTP"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
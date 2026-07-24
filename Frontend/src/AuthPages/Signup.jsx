import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/auth";
import Hyperspeed from "../Styles/Hyperspeed";

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
  }, []);

  // ================= OTP INPUT =================

  const handleOTPChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOTP = [...otp];

    newOTP[index] = value;

    setOtp(newOTP);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ================= SEND OTP =================

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
      setMessage("");

      const normalizedEmail = normalizeEmail(email);

      const res = await API.post("/send-otp", {
        email: normalizedEmail,
      });

      setMessage(res.data.message);
      setEmail(normalizedEmail);
      setOtpEmail(normalizedEmail);
      setEmailVerified(false);

      setTimer(60);

      setOtp(["", "", "", "", "", ""]);

      setShowOTPModal(true);
    } catch (error) {
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

      const res = await API.post("/verify-otp", {
        email: verificationEmail,
        code,
      });

      setMessage(res.data.message);

      setEmail(verificationEmail);
      setOtpEmail(verificationEmail);
      setEmailVerified(true);

      setShowOTPModal(false);
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

    if (!emailVerified) {
      setMessage("Please verify your email first.");
      return;
    }

    try {
      const signupEmail =
        otpEmail || normalizeEmail(email);

      const res = await API.post("/signup", {
        name,
        email: signupEmail,
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
    }
  };

  return (
    <div
      className="
        min-h-screen
        bg-black
        flex
        items-center
        justify-center
        p-4
        md:p-8
      "
    >
      {/* ==================================================
                         MAIN CONTAINER
      ================================================== */}

      <div
        className="
          w-full
          max-w-290
          min-h-170
          bg-violet-950/10
          shadow-violet-800/20
          shadow-2xl
          rounded-2xl
          overflow-hidden
          flex
        "
      >
        {/* ==================================================
                           LEFT SIDE
        ================================================== */}

        <div className="hidden lg:block w-[50%] p-4">
          <div
            className="
              relative
              w-full
              h-full
              min-h-[648px]
              rounded-xl
              overflow-hidden
              bg-black
            "
          >
            {/* HYPERSPEED */}

            <div className="absolute inset-0 z-0">
              <Hyperspeed
                effectOptions={hyperspeedOptions}
              />
            </div>

            {/* DARK GRADIENT */}

            <div
              className="
                absolute
                inset-0
                z-[1]
                bg-gradient-to-b
                from-black/10
                via-transparent
                to-black/80
                pointer-events-none
              "
            />

            {/* LOGO */}

            <div
              className="
                absolute
                top-8
                left-8
                z-10
              "
            >
              <h2
                className="
                  text-white
                  text-3xl
                  font-bold
                  tracking-tight
                "
              >
                CodeGPM
              </h2>
            </div>

            {/* BACK BUTTON */}

            <Link
              to="/"
              className="
                absolute
                top-7
                right-7
                z-10

                px-4
                py-2

                rounded-full

                bg-white/5
                hover:bg-white/10

                border
                border-white/10

                backdrop-blur-md

                text-white
                text-sm

                transition
              "
            >
              Back to website →
            </Link>

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

            <p
              className="
                text-[#a9a3b3]
                mt-4
                text-sm
              "
            >
              Already have an account?{" "}
              <Link
                to="/login"
                className="
                  text-[#b69cff]
                  underline
                  hover:text-white
                  transition
                "
              >
                Log in
              </Link>
            </p>

            {/* MESSAGE */}

            {message && (
              <div
                className="
                  mt-5

                  px-4
                  py-3

                  rounded-lg

                  bg-[#372f47]

                  border
                  border-[#574a70]

                  text-[#c4b3ff]
                  text-sm
                "
              >
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
                className="
                  w-full

                  bg-[#3b3449]

                  border
                  border-transparent

                  text-white

                  placeholder:text-[#8e879b]

                  rounded-lg

                  px-5
                  py-4

                  outline-none

                  transition

                  focus:border-[#8b6cff]
                  focus:ring-1
                  focus:ring-[#8b6cff]
                "
              />

              {/* EMAIL + VERIFY */}

              <div className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  disabled={
                    emailVerified || showOTPModal
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
                  className="
                    min-w-0
                    flex-1

                    bg-[#3b3449]

                    border
                    border-transparent

                    text-white

                    placeholder:text-[#8e879b]

                    rounded-lg

                    px-5
                    py-4

                    outline-none

                    transition

                    focus:border-[#8b6cff]
                    focus:ring-1
                    focus:ring-[#8b6cff]

                    disabled:opacity-60
                  "
                />

                {!emailVerified ? (
                  <button
                    type="button"
                    onClick={sendOTP}
                    disabled={sendingOTP}
                    className="
                      px-5

                      rounded-lg

                      bg-[#7254c9]
                      hover:bg-[#8061dc]

                      disabled:opacity-50

                      text-white
                      text-sm
                      font-medium

                      transition
                    "
                  >
                    {sendingOTP
                      ? "Sending..."
                      : "Verify"}
                  </button>
                ) : (
                  <div
                    className="
                      flex
                      items-center

                      px-4

                      rounded-lg

                      bg-emerald-500/10

                      border
                      border-emerald-500/30

                      text-emerald-400
                      text-sm

                      whitespace-nowrap
                    "
                  >
                    ✓ Verified
                  </div>
                )}
              </div>

              {/* PASSWORD */}

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                className="
                  w-full

                  bg-[#3b3449]

                  border
                  border-transparent

                  text-white

                  placeholder:text-[#8e879b]

                  rounded-lg

                  px-5
                  py-4

                  outline-none

                  transition

                  focus:border-[#8b6cff]
                  focus:ring-1
                  focus:ring-[#8b6cff]
                "
              />

              {/* CONFIRM PASSWORD */}

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm your password"
                className="
                  w-full

                  bg-[#3b3449]

                  border
                  border-transparent

                  text-white

                  placeholder:text-[#8e879b]

                  rounded-lg

                  px-5
                  py-4

                  outline-none

                  transition

                  focus:border-[#8b6cff]
                  focus:ring-1
                  focus:ring-[#8b6cff]
                "
              />

              {/* CREATE ACCOUNT */}

              <button
                type="submit"
                disabled={!emailVerified}
                className={`
                  w-full
                  py-4
                  mt-2
                  rounded-lg
                  text-white
                  font-medium
                  transition

                  ${emailVerified
                    ? `
                        bg-[#7656d1]
                        hover:bg-[#8565df]
                      `
                    : `
                        bg-[#554d63]
                        text-white/40
                        cursor-not-allowed
                      `
                  }
                `}
              >
                Create account
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
              <div className="h-px bg-[#50485e] flex-1" />

              <span
                className="
                  text-[#81798c]
                  text-xs
                  whitespace-nowrap
                "
              >
                Create your workspace
              </span>

              <div className="h-px bg-[#50485e] flex-1" />
            </div>

            <p
              className="
                text-center
                text-xs
                text-[#756e80]
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
            backdrop-blur-sm

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

              bg-[#2b2438]

              border
              border-[#4b425a]

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

                text-[#958da0]
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
                text-[#9991a5]
                mt-3
                text-sm
              "
            >
              We've sent a 6-digit verification code to
            </p>

            <p
              className="
                text-center
                text-[#b69cff]
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
                  className="
                    w-11
                    h-14

                    sm:w-12

                    text-center
                    text-xl
                    text-white

                    bg-[#3b3449]

                    border
                    border-[#51475f]

                    rounded-lg

                    outline-none

                    focus:border-[#8b6cff]
                    focus:ring-1
                    focus:ring-[#8b6cff]
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

                bg-[#7656d1]
                hover:bg-[#8565df]

                disabled:opacity-50

                text-white

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

                text-[#b69cff]
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

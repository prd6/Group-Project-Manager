import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/auth";
import Hyperspeed from "../Styles/Hyperspeed";

export default function Login() {
  const navigate = useNavigate();

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // ================= CAROUSEL =================

  const [activeSlide, setActiveSlide] = useState(0);

  const slides = useMemo(
    () => [
      {
        title: "Welcome Back,\nLet's Build",
        description:
          "Your projects and your team are waiting.",
      },
      {
        title: "Pick Up Where\nYou Left Off",
        description:
          "Jump back into your projects and keep moving.",
      },
      {
        title: "Together We\nBuild Better",
        description:
          "Collaborate, organize and bring ideas to life.",
      },
    ],
    []
  );

  // ================= AUTO SLIDER =================

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setActiveSlide(
        (prev) => (prev + 1) % slides.length
      );
    }, 3000);

    return () => clearInterval(slideInterval);
  }, [slides]);

  // ================= LOGIN =================

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    try {
      setLoggingIn(true);
      setMessage("");

      const res = await API.post("/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      localStorage.setItem(
        "token",
        res.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      setMessage("Login Successful!");

      setTimeout(() => {
        if (res.data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }, 1000);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Something went wrong"
      );
    } finally {
      setLoggingIn(false);
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

            {/* ==================================================
                           BOTTOM CAROUSEL
            ================================================== */}

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
              {/* SLIDES */}

              <div className="overflow-hidden">
                <div
                  className="
                    flex
                    transition-transform
                    duration-500
                    ease-in-out
                  "
                  style={{
                    transform: `translateX(-${
                      activeSlide * 100
                    }%)`,
                  }}
                >
                  {slides.map((slide, index) => (
                    <div
                      key={index}
                      className="
                        min-w-full
                        text-center
                        px-2
                      "
                    >
                      <h3
                        className="
                          text-white
                          text-3xl
                          font-semibold
                          leading-tight
                          drop-shadow-lg
                          whitespace-pre-line
                        "
                      >
                        {slide.title}
                      </h3>

                      <p
                        className="
                          text-white/60
                          text-sm
                          mt-4
                        "
                      >
                        {slide.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SLIDE CONTROLS */}

              <div
                className="
                  flex
                  justify-center
                  items-center
                  gap-3
                  mt-8
                "
              >
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      setActiveSlide(index)
                    }
                    aria-label={`Go to slide ${
                      index + 1
                    }`}
                    className={`
                      h-1.5
                      rounded-full
                      transition-all
                      duration-300

                      ${
                        activeSlide === index
                          ? "w-10 bg-white"
                          : `
                            w-8
                            bg-white/30
                            hover:bg-white/60
                          `
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
              Welcome back
            </h1>

            <p
              className="
                text-[#a9a3b3]
                mt-4
                text-sm
              "
            >
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="
                  text-[#b69cff]
                  underline
                  hover:text-white
                  transition
                "
              >
                Sign up
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
                              LOGIN FORM
            ================================================== */}

            <form
              onSubmit={handleLogin}
              className="mt-8 space-y-4"
            >
              {/* EMAIL */}

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Email"
                autoComplete="email"
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

              {/* PASSWORD */}

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Password"
                autoComplete="current-password"
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

              {/* FORGOT PASSWORD */}

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="
                    text-sm
                    text-[#b69cff]
                    hover:text-white
                    transition
                  "
                >
                  Forgot password?
                </Link>
              </div>

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={loggingIn}
                className="
                  w-full
                  py-4
                  mt-2

                  rounded-lg

                  bg-[#7656d1]
                  hover:bg-[#8565df]

                  disabled:opacity-50
                  disabled:cursor-not-allowed

                  text-white
                  font-medium

                  transition
                "
              >
                {loggingIn
                  ? "Logging in..."
                  : "Login"}
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
              <div
                className="
                  h-px
                  bg-[#50485e]
                  flex-1
                "
              />

              <span
                className="
                  text-[#81798c]
                  text-xs
                  whitespace-nowrap
                "
              >
                Welcome back to CodeGPM
              </span>

              <div
                className="
                  h-px
                  bg-[#50485e]
                  flex-1
                "
              />
            </div>

            <p
              className="
                text-center
                text-xs
                text-[#756e80]
              "
            >
              Continue building great projects with
              your team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
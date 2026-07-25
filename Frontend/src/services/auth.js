import axios from "axios";
import { API_ORIGIN } from "./apiConfig";

const API = axios.create({
    baseURL: `${API_ORIGIN}/api/auth`,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 15000,
});

// ==========================================
// JWT
// ==========================================

API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ==========================================
// AUTH API
// ==========================================

const AuthAPI = {
    signup: (data) =>
        API.post("/signup", data),

    login: (data) =>
        API.post("/login", data),

    sendOTP: (email) =>
        API.post("/send-otp", {
            email,
        }),

    verifyOTP: (email, code) =>
        API.post("/verify-otp", {
            email,
            code,
        }),

    forgotPassword: (email) =>
        API.post("/forgot-password", {
            email,
        }),

    verifyResetOTP: (email, code) =>
        API.post("/verify-reset-otp", {
            email,
            code,
        }),

    resetPassword: (email, code, password) =>
        API.post("/reset-password", {
            email,
            code,
            password,
        }),
};

export default AuthAPI;
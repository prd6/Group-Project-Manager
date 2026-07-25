import axios from "axios";
import { API_ORIGIN } from "./apiConfig";

// ==========================================
// BASE API INSTANCE
// ==========================================

const API = axios.create({
    baseURL: `${API_ORIGIN}/api`,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 15000,
});

// ==========================================
// ATTACH JWT TOKEN
// ==========================================

API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ==========================================
// HANDLE API RESPONSES
// ==========================================

API.interceptors.response.use(
    (response) => response,

    (error) => {
        // Token missing, invalid, or expired
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            // Avoid unnecessary redirect loop
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default API;
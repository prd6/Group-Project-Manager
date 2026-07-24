import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token) {
        let user = null;

        try {
            user = storedUser
                ? JSON.parse(storedUser)
                : null;
        } catch {
            localStorage.removeItem("user");
        }

        // Admin
        if (user?.role === "admin") {
            return (
                <Navigate
                    to="/admin"
                    replace
                />
            );
        }

        // Normal logged-in user
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    // Not logged in
    return children;
};

export default PublicRoute;
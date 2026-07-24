import { Routes, Route } from "react-router-dom";

// Pages
import Home from "./Pages/Home";
import Dashboard from "./Pages/Dashboard";
import Workspace from "./Pages/Workspace";
import FilesPage from "./Pages/FilesPage";
import Profile from "./Pages/Profile";
// Error page
import ErrorPage from "./Pages/ErrorPage";
// Protected
import ProtectedRoute from "./Components/ProtectedRoute";
// Public
import PublicRoute from "./Components/PublicRoute";

// Auth Pages
import Login from "./AuthPages/Login";
import Signup from "./AuthPages/Signup";

// Admin Pages
import Admin from "./Admin/Admin";
import Users from "./Admin/Users";
import Groups from "./Admin/Groups";
import Files from "./Admin/Files";
import Storage from "./Admin/Storage";
import Messages from "./Admin/Messages";

// Components
import Navbar from "./Components/Navbar";
import AdminRoute from "./Components/AdminRoute";
import DashboardLayout from "./Components/DashboardLayout";

function App() {
    return (
        <Routes>

            {/* ========================================
                PUBLIC ROUTES
            ========================================= */}

            <Route
                path="/"
                element={
                    <>
                        <Navbar />
                        <Home />
                    </>
                }
            />

            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                }
            />

            <Route
                path="/signup"
                element={
                    <PublicRoute>
                        <Signup />
                    </PublicRoute>
                }
            />

            {/* ========================================
                DASHBOARD LAYOUT
            ========================================= */}

            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                <Route
                    path="/workspace/:groupId"
                    element={<Workspace />}
                />

                <Route
                    path="/workspace/:groupId/files"
                    element={<FilesPage />}
                />
            </Route>


            {/* ========================================
                OTHER USER ROUTES
            ========================================= */}

            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                }
            />


            {/* ========================================
                ADMIN ROUTES
            ========================================= */}

            <Route
                path="/admin"
                element={
                    <AdminRoute>
                        <Admin />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/users"
                element={
                    <AdminRoute>
                        <Users />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/groups"
                element={
                    <AdminRoute>
                        <Groups />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/files"
                element={
                    <AdminRoute>
                        <Files />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/storage"
                element={
                    <AdminRoute>
                        <Storage />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/messages"
                element={
                    <AdminRoute>
                        <Messages />
                    </AdminRoute>
                }
            />

            <Route path="*" element={<ErrorPage />} />

        </Routes>
    );
}

export default App;
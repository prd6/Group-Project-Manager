import { Routes, Route } from "react-router-dom";

// Pages
import Home from "./Pages/Home";
import Dashboard from "./Pages/Dashboard";
import Create_Grp from "./Pages/Create_Grp";
import Join_Grp from "./Pages/Join_Grp";
import Workspace from "./Pages/Workspace";
import FilesPage from "./Pages/FilesPage";
import Profile from "./Pages/Profile";

// Auth Pages
import Login from "./AuthPages/Login";
import Signup from "./AuthPages/Signup";

// Admin Pages
import Admin from "./Admin/Admin";
import Users from "./Admin/Users";
import Groups from "./Admin/Groups";
import Files from "./Admin/Files";
import Storage from "./Admin/Storage";

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

            <Route path="/login" element={<Login />} />

            <Route path="/signup" element={<Signup />} />

            {/* ========================================
                DASHBOARD LAYOUT
            ========================================= */}

            <Route element={<DashboardLayout />}>

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
                path="/Create_Grp"
                element={<Create_Grp />}
            />

            <Route
                path="/Join_Grp"
                element={<Join_Grp />}
            />

            <Route
                path="/profile"
                element={<Profile />}
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

        </Routes>
    );
}

export default App;
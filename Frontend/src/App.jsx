import { Routes, Route } from "react-router-dom";
import Dashboard from "./Pages/Dashboard";
import Create_Grp from "./Pages/Create_Grp";
import Join_Grp from "./Pages/Join_Grp"
import Workspace from "./Pages/Workspace"
import Navbar from "./Components/Navbar";
import Home from "./Pages/Home";
import Login from "./AuthPages/Login";
import Signup from "./AuthPages/Signup";
import Admin from "./Admin/Admin"
import Users from "./Admin/Users";
import Groups from "./Admin/Groups";
import Files from "./Admin/Files";
import Storage from "./Admin/Storage";
import AdminRoute from "./Components/AdminRoute";
import ForgotPassword from "./AuthPages/ForgotPassword";
import FilesPage from "./Pages/FilesPage";
import Profile from "./Pages/Profile";

function App() {
  return (
    <Routes>
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
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/Create_Grp" element={<Create_Grp />} />
      <Route path="/Join_Grp" element={<Join_Grp />} />
      <Route path="/workspace/:id" element={<Workspace />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/workspace/:groupId/files" element={<FilesPage />} />

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

import { Routes, Route } from "react-router-dom";
import Dashboard from "./Pages/Dashboard";
import Create_Grp from "./Pages/Create_Grp";
import Join_Grp from "./Pages/Join_Grp"
import Navbar from "./Components/Navbar";
import Home from "./Pages/Home";
import Login from "./AuthPages/Login";
import Signup from "./AuthPages/Signup";

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
      <Route path="/Dashboard" element={<Dashboard />} />
      <Route path="/Create_Grp" element={<Create_Grp />} />
      <Route path="/Join_Grp" element={<Join_Grp />} />
    </Routes>
  );
}

export default App;
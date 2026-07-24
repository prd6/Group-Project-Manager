import { Outlet } from "react-router-dom";
import DashboardNavbar from "./DashboardNavbar";

const DashboardLayout = () => {
    return (
        <>
            <DashboardNavbar />
            <Outlet />
        </>
    );
};

export default DashboardLayout;
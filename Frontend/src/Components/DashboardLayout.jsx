import { Outlet, useParams } from "react-router-dom";
import DashboardNavbar from "./DashboardNavbar";
import GroupChat from "./GroupChat";

const DashboardLayout = () => {
    const { groupId } = useParams();

    return (
        <>
            <DashboardNavbar />

            <Outlet />

            {/* Only show chat when user is inside a group */}
            {groupId && (
                <GroupChat
                    key={groupId}
                    groupId={groupId}
                />
            )}
        </>
    );
};

export default DashboardLayout;

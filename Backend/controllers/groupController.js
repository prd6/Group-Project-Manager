import Group from "../models/Group.js";

// ===========================================
// GENERATE JOIN CODE
// ===========================================

const generateJoinCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let code = "";

    for (let i = 0; i < 6; i++) {
        code += chars.charAt(
            Math.floor(Math.random() * chars.length)
        );
    }

    return code;
};

// ===========================================
// CREATE GROUP
// ===========================================

export const createGroup = async (req, res) => {
    try {
        const {
            groupName,
            projectName,
            description,
            deadline,
            maxMembers,
        } = req.body;

        if (!groupName) {
            return res.status(400).json({
                message: "Group Name is required",
            });
        }

        let joinCode;
        let existingGroup;

        do {
            joinCode = generateJoinCode();
            existingGroup = await Group.findOne({
                joinCode,
            });
        } while (existingGroup);

        const group = await Group.create({
            groupName,
            projectName,
            description,
            deadline,
            maxMembers,
            joinCode,

            members: [
                {
                    user: req.user.id,
                    role: "Owner",
                },
            ],
        });

        return res.status(201).json({
            message: "Group created successfully",
            group,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server Error",
        });
    }
};

// ===========================================
// JOIN GROUP
// ===========================================

export const joinGroup = async (req, res) => {
    try {
        const { joinCode } = req.body;

        if (!joinCode) {
            return res.status(400).json({
                message: "Join code is required",
            });
        }

        const group = await Group.findOne({
            joinCode,
        });

        if (!group) {
            return res.status(404).json({
                message: "Invalid join code",
            });
        }

        const alreadyMember = group.members.find(
            (member) =>
                member.user.toString() === req.user.id
        );

        if (alreadyMember) {
            return res.status(400).json({
                message:
                    "You are already a member of this group",
            });
        }

        if (group.members.length >= group.maxMembers) {
           return res.status(400).json({
               message:
                    "This group is full. Ask the owner to increase the team size or remove any member"
            });
        }

        group.members.push({
            user: req.user.id,
            role: "Member",
        });

        await group.save();

        return res.status(200).json({
            message: "Joined group successfully",
            group,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server Error",
        });
    }
};

// ===========================================
// GET MY GROUPS
// ===========================================

export const getMyGroups = async (req, res) => {
    try {
        const groups = await Group.find({
            "members.user": req.user.id,
        });

        const groupsWithRole = groups.map(
            (group) => {
                const currentMember =
                    group.members.find(
                        (member) =>
                            member.user.toString() ===
                            req.user.id.toString()
                    );

                return {
                    ...group.toObject(),
                    myRole: currentMember?.role,
                };
            }
        );

        return res.status(200).json(groupsWithRole);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server Error",
        });
    }
};

// ===========================================
// GET SINGLE GROUP
// ===========================================

export const getSingleGroup = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const group = await Group.findOne({
            _id: id,
            "members.user": req.user.id,
        }).populate(
            "members.user",
            "name email profilePicture"
        );

        if (!group) {
            return res.status(404).json({
                message: "Group not found",
            });
        }

        return res.status(200).json(group);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server Error",
        });
    }
};

// ===========================================
// LEAVE GROUP
// ===========================================

export const leaveGroup = async (req, res) => {
    try {
        const { id } = req.params;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({
                message: "Group not found",
            });
        }

        const member = group.members.find(
            (m) =>
                m.user.toString() ===
                req.user.id.toString()
        );

        if (!member) {
            return res.status(404).json({
                message:
                    "You are not a member of this group",
            });
        }

        if (member.role === "Owner") {
            return res.status(403).json({
                message:
                    "Group owner cannot leave the group.",
            });
        }

        group.members = group.members.filter(
            (m) =>
                m.user.toString() !==
                req.user.id.toString()
        );

        await group.save();

        return res.status(200).json({
            success: true,
            message:
                "You have left the group successfully.",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server Error",
        });
    }
};

// ====== CONTINUE IN PART 2 ======

// ===========================================
// REMOVE MEMBER
// ===========================================

export const removeMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({
                message: "Group not found",
            });
        }

        // Check if logged-in user is Owner
        const owner = group.members.find(
            (member) =>
                member.user.toString() ===
                    req.user.id.toString() &&
                member.role === "Owner"
        );

        if (!owner) {
            return res.status(403).json({
                message:
                    "Only the group owner can remove members.",
            });
        }

        // Member exists?
        const memberToRemove = group.members.find(
            (member) =>
                member.user.toString() ===
                memberId
        );

        if (!memberToRemove) {
            return res.status(404).json({
                message: "Member not found.",
            });
        }

        // Don't remove owner
        if (memberToRemove.role === "Owner") {
            return res.status(403).json({
                message:
                    "Owner cannot be removed.",
            });
        }

        group.members = group.members.filter(
            (member) =>
                member.user.toString() !==
                memberId
        );

        await group.save();

        const updatedGroup =
            await Group.findById(id).populate(
                "members.user",
                "name email profilePicture"
            );

        return res.status(200).json({
            success: true,
            message:
                "Member removed successfully.",
            group: updatedGroup,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server Error",
        });
    }
};

// ===========================================
// DELETE GROUP
// ===========================================

export const deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found",
            });
        }

        // Check if logged-in user is Owner
        const isOwner = group.members.some(
            (member) =>
                member.user.toString() ===
                    req.user.id.toString() &&
                member.role === "Owner"
        );

        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message:
                    "Only the group owner can delete this group",
            });
        }

        await Group.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message:
                "Group deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete group error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete group",
        });
    }
};
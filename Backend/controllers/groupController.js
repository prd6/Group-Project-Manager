import Group from "../models/Group.js";

// Generate Join Code
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

// Create Group
export const createGroup = async (req, res) => {
  try {
    const { groupName, projectName, description, deadline } = req.body;

    if (!groupName) {
      return res.status(400).json({
        message: "Group Name is required",
      });
    }

    let joinCode;
    let existingGroup;

    do {
      joinCode = generateJoinCode();
      existingGroup = await Group.findOne({ joinCode });
    } while (existingGroup);

    const group = await Group.create({
      groupName,
      projectName,
      description,
      deadline,
      joinCode,

      members: [
        {
          user: req.user.id,
          role: "Owner",
        },
      ],
    });

    res.status(201).json({
      message: "Group created successfully",
      group,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Join Group
export const joinGroup = async (req, res) => {
  try {
    const { joinCode } = req.body;

    if (!joinCode) {
      return res.status(400).json({
        message: "Join code is required",
      });
    }

    // Find the group
    const group = await Group.findOne({ joinCode });

    if (!group) {
      return res.status(404).json({
        message: "Invalid join code",
      });
    }

    // Check if the user is already a member
    const alreadyMember = group.members.find(
      (member) => member.user.toString() === req.user.id
    );

    if (alreadyMember) {
      return res.status(400).json({
        message: "You are already a member of this group",
      });
    }

    // Add the user
    group.members.push({
      user: req.user.id,
      role: "Member",
    });

    await group.save();

    res.status(200).json({
      message: "Joined group successfully",
      group,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Get My Groups
export const getMyGroups = async (req, res) => {
    try {
        const groups = await Group.find({
            "members.user": req.user.id,
        });

        const groupsWithRole = groups.map((group) => {

            // Find logged-in user inside members
            const currentMember = group.members.find(
                (member) =>
                    member.user.toString() === req.user.id.toString()
            );

            return {
                ...group.toObject(),

                // Add current user's role
                myRole: currentMember?.role,
            };
        });

        res.status(200).json(groupsWithRole);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error",
        });
    }
};

// Get Single Group
export const getSingleGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findOne({
    _id: id,
      "members.user": req.user.id,
    }).populate("members.user", "name email");

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    console.log(JSON.stringify(group, null, 2));

    res.status(200).json(group);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

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

        // Check if logged-in user is the owner
        const isOwner = group.members.some(
            (member) =>
                member.user.toString() === req.user.id.toString() &&
                member.role === "Owner"
        );

        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: "Only the group owner can delete this group",
            });
        }

        await Group.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Group deleted successfully",
        });

    } catch (error) {
        console.error("Delete group error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete group",
        });
    }
};
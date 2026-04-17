const Builder = require("../model/builder");
const Staff = require("../model/staff");
const Team = require("../model/team");

/**
 * Resolves the context for a given user ID.
 * Identifies if the user is a Builder (Admin) or Staff, and if Staff, whether they are a Team Leader.
 * 
 * @param {string} userId - The ID of the user from req.user.id
 * @returns {Promise<Object>} - { builderId, staffId, role, isTeamLeader, teamMembers, managedStaffIds }
 */
exports.resolveContext = async (userId) => {
  // 1. Check if user is a Builder
  const builder = await Builder.findOne({ userId, isDeleted: false });
  if (builder) {
    return {
      builderId: builder._id,
      staffId: null,
      role: "BUILDER",
      isTeamLeader: false,
      teamMembers: [],
      managedStaffIds: [] // Admin sees everyone, usually handled by query
    };
  }

  // 2. Check if user is a Staff
  const staff = await Staff.findOne({ userId, isDeleted: false });
  if (!staff) {
    throw new Error("User context not found");
  }

  // 3. Check if this staff is a Team Leader
  const teamsLed = await Team.find({ leaderId: staff._id, isDeleted: false });
  const isTeamLeader = teamsLed.length > 0;
  
  let managedStaffIds = [];
  if (isTeamLeader) {
    // Collect all unique members from all teams led by this staff
    const memberSet = new Set();
    teamsLed.forEach(team => {
      team.members.forEach(memberId => memberSet.add(memberId.toString()));
    });
    managedStaffIds = Array.from(memberSet);
  }

  return {
    builderId: staff.builderId,
    staffId: staff._id,
    role: "STAFF",
    isTeamLeader: isTeamLeader,
    managedStaffIds: managedStaffIds
  };
};

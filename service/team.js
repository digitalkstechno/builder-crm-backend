const Team = require("../model/team");
const Builder = require("../model/builder");

exports.createTeamService = async (builderUserId, teamData) => {
  const { teamName, leaderId, members } = teamData;

  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const newTeam = new Team({
    builderId: builder._id,
    teamName,
    leaderId,
    members,
  });

  await newTeam.save();
  return newTeam;
};

exports.fetchBuilderTeamsService = async (builderUserId, { page, limit, search }) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const skip = (page - 1) * limit;

  let query = { builderId: builder._id, isDeleted: false };
  if (search) {
    query.teamName = { $regex: search, $options: "i" };
  }

  const totalTeams = await Team.countDocuments(query);
  const teamData = await Team.find(query)
    .populate("leaderId", "userId staffRole")
    .populate({
      path: "leaderId",
      populate: { path: "userId", select: "fullName email phone" }
    })
    .populate({
      path: "members",
      populate: { path: "userId", select: "fullName email phone" }
    })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  return { totalTeams, teamData };
};

exports.deleteTeamService = async (teamId, builderUserId) => {
    const builder = await Builder.findOne({ userId: builderUserId });
    if (!builder) throw new Error("Builder not found");

    const team = await Team.findOne({ _id: teamId, builderId: builder._id });
    if (!team) throw new Error("Team not found");

    team.isDeleted = true;
    await team.save();
};

exports.updateTeamService = async (teamId, builderUserId, updateData) => {
    const builder = await Builder.findOne({ userId: builderUserId });
    if (!builder) throw new Error("Builder not found");

    const team = await Team.findOne({ _id: teamId, builderId: builder._id, isDeleted: false });
    if (!team) throw new Error("Team not found");

    const updatedTeam = await Team.findByIdAndUpdate(
        teamId, 
        { $set: updateData }, 
        { new: true }
    ).populate({
        path: "leaderId",
        populate: { path: "userId", select: "fullName" }
    });

    return updatedTeam;
};

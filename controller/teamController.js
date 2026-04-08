const {
  createTeamService,
  fetchBuilderTeamsService,
  deleteTeamService,
  updateTeamService,
} = require("../service/team");

exports.createTeam = async (req, res) => {
  try {
    const team = await createTeamService(req.user.id, req.body);
    return res.status(201).json({ 
      status: "Success", 
      message: "Team created successfully", 
      data: team 
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.fetchBuilderTeams = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const { totalTeams, teamData } = await fetchBuilderTeamsService(req.user.id, { page, limit, search });
    
    return res.status(200).json({ 
      status: "Success", 
      message: "Teams fetched successfully", 
      pagination: {
        totalRecords: totalTeams,
        currentPage: page,
        totalPages: Math.ceil(totalTeams / limit),
        limit
      },
      data: teamData 
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    await deleteTeamService(req.params.id, req.user.id);
    return res.status(200).json({ 
      status: "Success", 
      message: "Team deleted successfully" 
    });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const updatedTeam = await updateTeamService(req.params.id, req.user.id, req.body);
    return res.status(200).json({ 
      status: "Success", 
      message: "Team updated successfully", 
      data: updatedTeam 
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

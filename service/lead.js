const Lead = require("../model/lead");
const Builder = require("../model/builder");
const LeadStatus = require("../model/leadStatus");
const Staff = require("../model/staff");
const Site = require("../model/site");

exports.createLeadService = async (builderUserId, leadData) => {
  const { name, phone, siteId, source, budget, stageId, agentId, notes } = leadData;

  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  // Get site details
  const site = await Site.findOne({ _id: siteId, builderId: builder._id, isDeleted: false });
  if (!site) throw new Error("Site not found");

  // Get stage details
  const stage = await LeadStatus.findOne({ _id: stageId, builderId: builder._id, isDeleted: false });
  if (!stage) throw new Error("Lead status not found");

  // Get agent details if provided
  let agentName = null;
  if (agentId) {
    const agent = await Staff.findOne({ _id: agentId, builderId: builder._id, isDeleted: false });
    if (!agent) throw new Error("Agent not found");
    // Get agent user name
    const user = await require("../model/user").findOne({ _id: agent.userId });
    agentName = user ? user.fullName : null;
  }

  const newLead = new Lead({
    builderId: builder._id,
    name,
    phone,
    siteId,
    siteName: site.name,
    source,
    budget,
    stageId,
    stageName: stage.name,
    agentId,
    agentName,
    notes,
  });

  const savedLead = await newLead.save();

  // Format the response to match frontend expectations
  const formattedLead = {
    _id: savedLead._id,
    name: savedLead.name,
    phone: savedLead.phone,
    site: savedLead.siteName,
    source: savedLead.source,
    budget: savedLead.budget,
    stage: savedLead.stageName,
    stageId: savedLead.stageId,
    agent: savedLead.agentName || 'Unassigned',
    agentId: savedLead.agentId,
    createdAt: savedLead.createdAt.toISOString().split('T')[0],
    notes: savedLead.notes,
  };

  return formattedLead;
};

exports.fetchBuilderLeadsService = async (builderUserId, { page, limit, search }) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const skip = (page - 1) * limit;

  let query = { builderId: builder._id, isDeleted: false };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { siteName: { $regex: search, $options: "i" } }
    ];
  }

  const totalLeads = await Lead.countDocuments(query);
  const leadData = await Lead.find(query)
    .populate('stageId', 'name color')
    .populate('agentId', 'userId')
    .populate('siteId', 'name')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  // Format the data for frontend
  const formattedLeads = leadData.map(lead => ({
    _id: lead._id,
    name: lead.name,
    phone: lead.phone,
    site: lead.siteName,
    source: lead.source,
    budget: lead.budget,
    stage: lead.stageName,
    stageId: lead.stageId?._id,
    agent: lead.agentName || 'Unassigned',
    agentId: lead.agentId?._id,
    createdAt: lead.createdAt.toISOString().split('T')[0],
    notes: lead.notes,
  }));

  return { totalLeads, leadData: formattedLeads };
};

exports.updateLeadService = async (leadId, builderUserId, updateData) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const lead = await Lead.findOne({ _id: leadId, builderId: builder._id, isDeleted: false });
  if (!lead) throw new Error("Lead not found");

  // Update related data if needed
  if (updateData.siteId) {
    const site = await Site.findOne({ _id: updateData.siteId, builderId: builder._id, isDeleted: false });
    if (!site) throw new Error("Site not found");
    updateData.siteName = site.name;
  }

  if (updateData.stageId) {
    const stage = await LeadStatus.findOne({ _id: updateData.stageId, builderId: builder._id, isDeleted: false });
    if (!stage) throw new Error("Lead status not found");
    updateData.stageName = stage.name;
  }

  if (updateData.agentId) {
    if (updateData.agentId === 'unassigned') {
      updateData.agentId = null;
      updateData.agentName = null;
    } else {
      const agent = await Staff.findOne({ _id: updateData.agentId, builderId: builder._id, isDeleted: false });
      if (!agent) throw new Error("Agent not found");
      const user = await require("../model/user").findOne({ _id: agent.userId });
      updateData.agentName = user ? user.fullName : null;
    }
  }

  const updatedLead = await Lead.findByIdAndUpdate(
    leadId,
    { $set: updateData },
    { new: true }
  ).populate('stageId', 'name color')
   .populate('agentId', 'userId')
   .populate('siteId', 'name');

  // Format the updated lead to match frontend expectations
  const formattedLead = {
    _id: updatedLead._id,
    name: updatedLead.name,
    phone: updatedLead.phone,
    site: updatedLead.siteName,
    source: updatedLead.source,
    budget: updatedLead.budget,
    stage: updatedLead.stageId?.name || updatedLead.stageName,
    stageId: updatedLead.stageId?._id,
    agent: updatedLead.agentName || 'Unassigned',
    agentId: updatedLead.agentId?._id,
    createdAt: updatedLead.createdAt.toISOString().split('T')[0],
    notes: updatedLead.notes,
  };

  return formattedLead;
};

exports.deleteLeadService = async (leadId, builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const lead = await Lead.findOne({ _id: leadId, builderId: builder._id });
  if (!lead) throw new Error("Lead not found");

  lead.isDeleted = true;
  await lead.save();
};

exports.getLeadByIdService = async (leadId, builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const lead = await Lead.findOne({ _id: leadId, builderId: builder._id, isDeleted: false })
    .populate('stageId', 'name color')
    .populate('agentId', 'userId')
    .populate('siteId', 'name');

  if (!lead) throw new Error("Lead not found");

  return lead;
};

// Get all lead statuses for dropdown
exports.getLeadStatusesService = async (builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const statuses = await LeadStatus.find({
    builderId: builder._id,
    isDeleted: false
  }).sort({ order: 1 });

  return statuses;
};

// Get all staff for dropdown
exports.getStaffDropdownService = async (builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const staff = await Staff.find({
    builderId: builder._id,
    isDeleted: false
  }).populate('userId', 'fullName email phone');

  return staff.map(s => ({
    _id: s._id,
    name: s.userId ? s.userId.fullName : 'Unknown',
    email: s.userId ? s.userId.email : '',
    role: s.staffRole
  }));
};

// Get all sites for dropdown
exports.getSitesDropdownService = async (builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const sites = await Site.find({
    builderId: builder._id,
    isDeleted: false
  }).select('name city area teamId');

  return sites;
};

// Get team members for a specific site
exports.getSiteTeamMembersService = async (siteId, builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  // Find the site and get its team
  const site = await Site.findOne({
    _id: siteId,
    builderId: builder._id,
    isDeleted: false
  });

  if (!site || !site.teamId) {
    return { leader: null, members: [] };
  }

  // Get the team with populated leader and members
  const team = await require("../model/team").findOne({
    _id: site.teamId,
    builderId: builder._id,
    isDeleted: false
  }).populate('leaderId', 'userId')
    .populate('members', 'userId');

  if (!team) {
    return { leader: null, members: [] };
  }

  // Get user details for leader
  const leaderUser = team.leaderId ? await require("../model/user").findOne({ _id: team.leaderId.userId }) : null;
  const leader = leaderUser ? {
    _id: team.leaderId._id,
    name: leaderUser.fullName,
    email: leaderUser.email,
    role: 'Team Leader'
  } : null;

  // Get user details for members
  const members = [];
  for (const member of team.members) {
    const memberUser = await require("../model/user").findOne({ _id: member.userId });
    if (memberUser) {
      members.push({
        _id: member._id,
        name: memberUser.fullName,
        email: memberUser.email,
        role: 'Team Member'
      });
    }
  }

  return { leader, members };
};
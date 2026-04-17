const Lead = require("../model/lead");
const Builder = require("../model/builder");
const LeadStatus = require("../model/leadStatus");
const Staff = require("../model/staff");
const Site = require("../model/site");
const Followup = require("../model/followup");
const Reminder = require("../model/reminder");
const Notification = require("../model/notification");
const { resolveContext } = require("../utils/context");
const { getIO } = require("../utils/socket");

exports.createLeadService = async (userId, leadData) => {
  const { name, phone, siteId, source, budget, stageId, agentId, notes } = leadData;

  const context = await resolveContext(userId);
  const { builderId, staffId, role } = context;

  // Get site details
  const site = await Site.findOne({ _id: siteId, builderId, isDeleted: false });
  if (!site) throw new Error("Site not found");

  // Get stage details
  let stage;
  if (stageId && mongoose.Types.ObjectId.isValid(stageId)) {
    stage = await LeadStatus.findOne({ _id: stageId, builderId, isDeleted: false });
  }
  
  if (!stage) {
    // Fallback to the first available status if none provided or valid
    stage = await LeadStatus.findOne({ builderId, isDeleted: false }).sort({ order: 1 });
  }
  
  if (!stage) throw new Error("Lead status not found and no default available");

  const finalStageId = stage._id;

  // Assignment logic
  let finalAgentId = agentId;
  let agentName = null;

  // If staff creates lead, assign to them
  if (role === 'STAFF' && !finalAgentId) {
    finalAgentId = staffId;
  }

  if (finalAgentId) {
    const agent = await Staff.findOne({ _id: finalAgentId, builderId, isDeleted: false }).populate('userId');
    if (!agent) throw new Error("Agent not found");
    agentName = agent.userId ? agent.userId.fullName : null;
  }

  const newLead = new Lead({
    builderId,
    name,
    phone,
    siteId,
    siteName: site.name,
    source,
    budget,
    stageId: finalStageId,
    stageName: stage.name,
    agentId: finalAgentId,
    agentName,
    notes,
  });

  const savedLead = await newLead.save();

  // Notification if assigned
  if (finalAgentId) {
    try {
      const agent = await Staff.findById(finalAgentId);
      if (agent) {
        const notification = new Notification({
          title: "New Lead Assigned",
          message: `New lead "${savedLead.name}" has been assigned to you.`,
          type: "lead_assigned",
          leadId: savedLead._id,
          builderId,
          recipientId: agent.userId,
        });
        await notification.save();

        const io = getIO();
        io.emit("newLeadAssigned", {
          notification,
          agentId: finalAgentId,
          leadId: savedLead._id,
          leadName: savedLead.name
        });
      }
    } catch (err) {
      console.error("Socket notification error:", err.message);
    }
  }

  // Format the response
  return {
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
};

exports.fetchBuilderLeadsService = async (userId, { page, limit, search, status, source, agent, filterType }) => {
  const context = await resolveContext(userId);
  const { builderId, staffId, role, isTeamLeader, managedStaffIds } = context;

  const skip = (page - 1) * limit;
  let query = { builderId, isDeleted: false };

  // Context-based filtering
  if (role === 'STAFF') {
    if (isTeamLeader) {
      // Team Leader Logic
      if (filterType === 'team') {
        // Staff under this leader
        query.agentId = { $in: managedStaffIds };
      } else if (filterType === 'my') {
        // Only leads assigned directly to the leader
        query.agentId = staffId;
      } else {
        // Both leader and team (default or 'all')
        query.$or = [
          { agentId: staffId },
          { agentId: { $in: managedStaffIds } }
        ];
      }
    } else {
      // Regular Staff Logic
      query.agentId = staffId;
    }
  }

  // Override context filter if specific agent is selected (only if user has permission)
  if (agent && agent !== 'all') {
    if (role === 'BUILDER') {
      if (agent === 'unassigned') query.agentId = null;
      else query.agentId = agent;
    } else if (isTeamLeader) {
      // TL can filter for themselves or their team members
      if (agent === staffId.toString() || managedStaffIds.map(id => id.toString()).includes(agent)) {
        query.agentId = agent;
        delete query.$or; // Remove the default TL OR query
      }
    }
    // Note: Regular staff cannot change agent filter to see others' leads
  }

  // Search filter
  if (search) {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { siteName: { $regex: search, $options: "i" } }
      ]
    });
  }

  // Status filter
  if (status && status !== 'all') {
    query.stageId = status;
  }

  // Source filter
  if (source && source !== 'all') {
    query.source = source;
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

exports.updateLeadService = async (leadId, userId, updateData) => {
  const context = await resolveContext(userId);
  const { builderId, staffId, role, isTeamLeader, managedStaffIds } = context;

  const lead = await Lead.findOne({ _id: leadId, builderId, isDeleted: false });
  if (!lead) throw new Error("Lead not found");

  // Permission Check: Regular staff can only update leads assigned to them
  if (role === 'STAFF' && !isTeamLeader) {
    if (lead.agentId && lead.agentId.toString() !== staffId.toString()) {
      throw new Error("You do not have permission to update this lead");
    }
  }
  // Permission Check: Team Leader can update leads assigned to them or their team
  if (role === 'STAFF' && isTeamLeader) {
    const isLeadAssignedToTL = lead.agentId && lead.agentId.toString() === staffId.toString();
    const isLeadAssignedToTeam = lead.agentId && managedStaffIds.map(id => id.toString()).includes(lead.agentId.toString());
    
    if (!isLeadAssignedToTL && !isLeadAssignedToTeam) {
      // If it's not assigned to either, TL can only update it if they are the one being assigned it now
      // Actually, TL should probably be able to assign unassigned leads or leads for their team.
    }
  }

  // Update site if changed
  if (updateData.siteId) {
    const site = await Site.findOne({ _id: updateData.siteId, builderId, isDeleted: false });
    if (!site) throw new Error("Site not found");
    updateData.siteName = site.name;
  }

  // Update stage if changed
  if (updateData.stageId) {
    const stage = await LeadStatus.findOne({ _id: updateData.stageId, builderId, isDeleted: false });
    if (!stage) throw new Error("Lead status not found");
    updateData.stageName = stage.name;
  }

  // Update agent if changed
  let agentChanged = false;
  if (updateData.agentId) {
    if (updateData.agentId === 'unassigned') {
      updateData.agentId = null;
      updateData.agentName = null;
    } else {
      const agent = await Staff.findOne({ _id: updateData.agentId, builderId, isDeleted: false }).populate('userId');
      if (!agent) throw new Error("Agent not found");
      updateData.agentName = agent.userId ? agent.userId.fullName : null;
      
      // Check if assignment actually changed
      if (!lead.agentId || lead.agentId.toString() !== updateData.agentId.toString()) {
        agentChanged = true;
      }
    }
  }

  const updatedLead = await Lead.findByIdAndUpdate(
    leadId,
    { $set: updateData },
    { new: true }
  ).populate('stageId', 'name color')
   .populate('agentId', 'userId')
   .populate('siteId', 'name');

  // Notification if agent changed
  if (agentChanged && updatedLead.agentId) {
    try {
      const notification = new Notification({
        title: "Lead Reassigned",
        message: `Lead "${updatedLead.name}" has been assigned to you.`,
        type: "lead_assigned",
        leadId: updatedLead._id,
        builderId,
        recipientId: updatedLead.agentId.userId,
      });
      await notification.save();

      const io = getIO();
      io.emit("leadReassigned", {
        notification,
        agentId: updatedLead.agentId._id,
        leadId: updatedLead._id,
        leadName: updatedLead.name
      });
    } catch (err) {
      console.error("Socket notification error:", err.message);
    }
  }

  return {
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
exports.getLeadStatusesService = async (userId) => {
  const { builderId } = await resolveContext(userId);

  const statuses = await LeadStatus.find({
    builderId,
    isDeleted: false
  }).sort({ order: 1 });

  return statuses;
};

// Get all staff for dropdown
exports.getStaffDropdownService = async (userId) => {
  const { builderId } = await resolveContext(userId);

  const staff = await Staff.find({
    builderId,
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
exports.getSitesDropdownService = async (userId) => {
  const { builderId } = await resolveContext(userId);

  const sites = await Site.find({
    builderId,
    isDeleted: false
  }).select('name city area teamId');

  return sites;
};

// Get team members for a specific site
exports.getSiteTeamMembersService = async (siteId, userId) => {
  const { builderId } = await resolveContext(userId);

  // Find the site and get its team
  const site = await Site.findOne({
    _id: siteId,
    builderId,
    isDeleted: false
  });

  if (!site || !site.teamId) {
    return { leader: null, members: [] };
  }

  // Get the team with populated leader and members
  const team = await require("../model/team").findOne({
    _id: site.teamId,
    builderId,
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

// Followup services
exports.createFollowupService = async (userId, followupData) => {
  const { leadId, followupDate, followupTime, notes } = followupData;

  const { builderId } = await resolveContext(userId);

  // Verify lead belongs to builder
  const lead = await Lead.findOne({ _id: leadId, builderId, isDeleted: false });
  if (!lead) throw new Error("Lead not found");

  // Combine date and time into a single DateTime
  const followupDateTime = new Date(`${followupDate}T${followupTime || '09:00'}:00`);

  const newFollowup = new Followup({
    builderId,
    leadId,
    followupDate: followupDateTime,
    notes,
    createdBy: userId, // Use user ID directly
  });

  const savedFollowup = await newFollowup.save();

  // Create a reminder for this followup (remind 1 day before)
  const reminderDate = new Date(followupDateTime);
  reminderDate.setDate(reminderDate.getDate() - 1);

  const reminder = new Reminder({
    builderId,
    leadId,
    followupId: savedFollowup._id,
    reminderDate,
    message: `Followup reminder for ${lead.name} - ${notes}`,
  });

  await reminder.save();

  return savedFollowup;
};

exports.getLeadFollowupsService = async (leadId, builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  // Verify lead belongs to builder
  const lead = await Lead.findOne({ _id: leadId, builderId: builder._id, isDeleted: false });
  if (!lead) throw new Error("Lead not found");

  const followups = await Followup.find({
    leadId,
    builderId: builder._id,
    isDeleted: false
  }).populate('createdBy', 'fullName')
    .sort({ followupDate: -1 });

  // Format followups with creator names
  const formattedFollowups = followups.map((followup) => ({
    _id: followup._id,
    followupDate: followup.followupDate.toISOString().split('T')[0],
    notes: followup.notes,
    isCompleted: followup.isCompleted,
    completedAt: followup.completedAt,
    createdBy: followup.createdBy ? followup.createdBy.fullName : 'Unknown',
    createdAt: followup.createdAt.toISOString().split('T')[0],
  }));

  return formattedFollowups;
};

exports.updateFollowupService = async (followupId, builderUserId, updateData) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const followup = await Followup.findOne({
    _id: followupId,
    builderId: builder._id,
    isDeleted: false
  });

  if (!followup) throw new Error("Followup not found");

  const updatedFollowup = await Followup.findByIdAndUpdate(
    followupId,
    { $set: updateData },
    { new: true }
  ).populate('createdBy', 'userId');

  return updatedFollowup;
};

exports.deleteFollowupService = async (followupId, builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const followup = await Followup.findOne({
    _id: followupId,
    builderId: builder._id,
    isDeleted: false
  });

  if (!followup) throw new Error("Followup not found");

  followup.isDeleted = true;
  await followup.save();

  // Also mark related reminders as inactive
  await Reminder.updateMany(
    { followupId, builderId: builder._id },
    { isActive: false }
  );
};
const {
  createLeadService,
  fetchBuilderLeadsService,
  deleteLeadService,
  updateLeadService,
  getLeadByIdService,
  getLeadStatusesService,
  getStaffDropdownService,
  getSitesDropdownService,
  getSiteTeamMembersService,
  createFollowupService,
  getLeadFollowupsService,
  updateFollowupService,
  deleteFollowupService,
} = require("../service/lead");

exports.createLead = async (req, res) => {
  try {
    const lead = await createLeadService(req.user.id, req.body);
    return res.status(201).json({
      status: "Success",
      message: "Lead created successfully",
      data: lead
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.fetchBuilderLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status;
    const source = req.query.source;
    const agent = req.query.agent;

    const { totalLeads, leadData } = await fetchBuilderLeadsService(req.user.id, { page, limit, search, status, source, agent });

    return res.status(200).json({
      status: "Success",
      message: "Leads fetched successfully",
      pagination: {
        totalRecords: totalLeads,
        currentPage: page,
        totalPages: Math.ceil(totalLeads / limit),
        limit
      },
      data: leadData
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    await deleteLeadService(req.params.id, req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Lead deleted successfully"
    });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const updatedLead = await updateLeadService(req.params.id, req.user.id, req.body);
    return res.status(200).json({
      status: "Success",
      message: "Lead updated successfully",
      data: updatedLead
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.getLeadById = async (req, res) => {
  try {
    const lead = await getLeadByIdService(req.params.id, req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Lead fetched successfully",
      data: lead
    });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};

exports.getLeadStatuses = async (req, res) => {
  try {
    const statuses = await getLeadStatusesService(req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Lead statuses fetched successfully",
      data: statuses
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.getStaffDropdown = async (req, res) => {
  try {
    const staff = await getStaffDropdownService(req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Staff fetched successfully",
      data: staff
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.getSitesDropdown = async (req, res) => {
  try {
    const sites = await getSitesDropdownService(req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Sites fetched successfully",
      data: sites
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.getSiteTeamMembers = async (req, res) => {
  try {
    const { siteId } = req.params;
    const teamMembers = await getSiteTeamMembersService(siteId, req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Site team members fetched successfully",
      data: teamMembers
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

// Followup controllers
exports.createFollowup = async (req, res) => {
  try {
    const followup = await createFollowupService(req.user.id, req.body);
    return res.status(201).json({
      status: "Success",
      message: "Followup created successfully",
      data: followup
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.getLeadFollowups = async (req, res) => {
  try {
    const { leadId } = req.params;
    const followups = await getLeadFollowupsService(leadId, req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Followups fetched successfully",
      data: followups
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.updateFollowup = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFollowup = await updateFollowupService(id, req.user.id, req.body);
    return res.status(200).json({
      status: "Success",
      message: "Followup updated successfully",
      data: updatedFollowup
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.deleteFollowup = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteFollowupService(id, req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Followup deleted successfully"
    });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};

// Reminder controllers
exports.getReminders = async (req, res) => {
  try {
    const builder = await require("../model/builder").findOne({ userId: req.user.id });
    if (!builder) throw new Error("Builder not found");

    const { status, page = 1, limit = 10 } = req.query;
    const numericLimit = parseInt(limit);
    const numericPage = parseInt(page);
    const skip = (numericPage - 1) * numericLimit;

    let query = {
      builderId: builder._id,
      isActive: true,
      isDeleted: false
    };

    // Use aggregation pipeline for proper filtering by followup date
    let matchConditions = {
      builderId: builder._id,
      isActive: true,
      isDeleted: false
    };

    if (status === 'missed') {
      // Reminders for followups that are overdue (past due date)
      matchConditions.isSent = false;
    } else if (status === 'today') {
      // Reminders for followups due today
      matchConditions.isSent = false;
    } else if (status === 'upcoming') {
      // Reminders for future followups
      matchConditions.isSent = false;
    } else if (status === 'completed') {
      matchConditions.isSent = true;
    }

    // Build aggregation pipeline
    let pipeline = [
      {
        $match: matchConditions
      },
      {
        $lookup: {
          from: 'followups',
          localField: 'followupId',
          foreignField: '_id',
          as: 'followup'
        }
      },
      {
        $unwind: '$followup'
      }
    ];

    // Add date filtering based on followup.followupDate
    if (status === 'missed') {
      pipeline.push({
        $match: {
          'followup.followupDate': { $lt: new Date() }
        }
      });
    } else if (status === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      pipeline.push({
        $match: {
          'followup.followupDate': { $gte: today, $lt: tomorrow }
        }
      });
    } else if (status === 'upcoming') {
      pipeline.push({
        $match: {
          'followup.followupDate': { $gt: new Date() }
        }
      });
    }

    // Add lookups for lead data
    pipeline.push(
      {
        $lookup: {
          from: 'leads',
          localField: 'leadId',
          foreignField: '_id',
          as: 'lead'
        }
      },
      {
        $unwind: { path: '$lead', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'leads',
          localField: 'followup.leadId',
          foreignField: '_id',
          as: 'followupLead'
        }
      },
      {
        $unwind: { path: '$followupLead', preserveNullAndEmptyArrays: true }
      },
      {
        $sort: { 'followup.followupDate': 1 }
      },
      {
        $skip: skip
      },
      {
        $limit: numericLimit
      }
    );

    const totalReminders = await require("../model/reminder").aggregate([
      ...pipeline.slice(0, -3), // Remove skip, limit, and sort for count
      { $count: "total" }
    ]).then(result => result[0]?.total || 0);

    const reminders = await require("../model/reminder").aggregate(pipeline);

    const formattedReminders = reminders.map(reminder => {
      // Extract lead info - aggregation returns arrays
      const lead = reminder.lead || reminder.followupLead;
      const followup = reminder.followup;

      return {
        _id: reminder._id,
        lead: lead?.name || 'Unknown Lead',
        leadId: lead?._id?.toString() || followup?.leadId?.toString(),
        phone: lead?.phone || '',
        followupDate: followup?.followupDate?.toISOString().split('T')[0] || '',
        notes: followup?.notes || reminder.message,
        reminderDate: reminder.reminderDate.toISOString().split('T')[0],
        reminderTime: reminder.reminderDate.toTimeString().split(' ')[0].substring(0, 5),
        isSent: reminder.isSent,
        sentAt: reminder.sentAt,
        type: 'Followup',
        priority: followup?.followupDate < new Date() && !reminder.isSent ? 'High' : 'Medium'
      };
    });

    return res.status(200).json({
      status: "Success",
      message: "Reminders fetched successfully",
      pagination: {
        totalRecords: totalReminders,
        currentPage: numericPage,
        totalPages: Math.ceil(totalReminders / numericLimit),
        limit: numericLimit
      },
      data: formattedReminders
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.markReminderCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const builder = await require("../model/builder").findOne({ userId: req.user.id });
    if (!builder) throw new Error("Builder not found");

    const reminder = await require("../model/reminder").findOneAndUpdate(
      { _id: id, builderId: builder._id, isDeleted: false },
      {
        isSent: true,
        sentAt: new Date()
      },
      { new: true }
    );

    if (!reminder) throw new Error("Reminder not found");

    return res.status(200).json({
      status: "Success",
      message: "Reminder marked as completed"
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};
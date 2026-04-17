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
const XLSX = require("xlsx");

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

exports.getTodayCounts = async (req, res) => {
  try {
    const Lead = require("../model/lead");
    const Reminder = require("../model/reminder");
    const Builder = require("../model/builder");
    const Staff = require("../model/staff");
    const mongoose = require("mongoose");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Builder ya staff dono ke liye builderId nikalo
    let builderId;
    const builder = await Builder.findOne({ userId: req.user.id, isDeleted: false }, "_id");
    if (builder) {
      builderId = builder._id;
    } else {
      const staff = await Staff.findOne({ userId: req.user.id, isDeleted: false }, "builderId");
      if (staff) builderId = staff.builderId;
    }

    if (!builderId) return res.status(200).json({ status: "Success", data: { leads: 0, reminders: 0 } });

    const [leads, reminders] = await Promise.all([
      Lead.countDocuments({
        builderId,
        isDeleted: false,
        createdAt: { $gte: today, $lt: tomorrow },
      }),
      Reminder.aggregate([
        { $match: { builderId: new mongoose.Types.ObjectId(builderId), isActive: true, isDeleted: false, isSent: false } },
        { $lookup: { from: 'followups', localField: 'followupId', foreignField: '_id', as: 'followup' } },
        { $unwind: '$followup' },
        { $match: { 'followup.followupDate': { $gte: today, $lt: tomorrow } } },
        { $count: 'total' }
      ]).then(r => r[0]?.total || 0)
    ]);

    return res.status(200).json({ status: "Success", data: { leads, reminders } });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
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

// Export leads to Excel - with active filters support
exports.exportLeads = async (req, res) => {
  try {
    const Builder = require("../model/builder");
    const Lead = require("../model/lead");

    const builder = await Builder.findOne({ userId: req.user.id });
    if (!builder) throw new Error("Builder not found");

    const { search, status, source, agent } = req.query;

    let query = { builderId: builder._id, isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { siteName: { $regex: search, $options: "i" } }
      ];
    }
    if (status && status !== "all") query.stageId = require("mongoose").Types.ObjectId.isValid(status) ? require("mongoose").Types.ObjectId.createFromHexString(status) : status;
    if (source && source !== "all") query.source = source;
    if (agent && agent !== "all") {
      if (agent === "unassigned") query.agentId = null;
      else query.agentId = require("mongoose").Types.ObjectId.isValid(agent) ? require("mongoose").Types.ObjectId.createFromHexString(agent) : agent;
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });

    const rows = leads.map((lead, index) => ({
      "Sr No": index + 1,
      "Name": lead.name || "",
      "Phone": lead.phone || "",
      "Site": lead.siteName || "",
      "Source": lead.source || "",
      "Budget": lead.budget || "",
      "Stage": lead.stageName || "",
      "Agent": lead.agentName || "Unassigned",
      "Notes": lead.notes || "",
      "Created At": lead.createdAt ? lead.createdAt.toISOString().split("T")[0] : "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 6 }, { wch: 22 }, { wch: 15 }, { wch: 25 }, { wch: 12 },
      { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 14 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", "attachment; filename=leads_export.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

// Helper: write Excel data-validation dropdown into a sheet
function addDropdownValidation(ws, colLetter, totalDataRows, optionList) {
  if (!ws["!dataValidations"]) ws["!dataValidations"] = [];
  const formula = `"${optionList.join(",")}"`;
  ws["!dataValidations"].push({
    type: "list",
    sqref: `${colLetter}2:${colLetter}${totalDataRows + 1}`,
    formula1: formula,
    showDropDown: false,
    showErrorMessage: true,
    errorTitle: "Invalid value",
    error: `Please select from the list`,
  });
}

// Download sample Excel with real in-cell dropdowns
exports.downloadSampleExcel = async (req, res) => {
  try {
    const Builder = require("../model/builder");
    const LeadStatus = require("../model/leadStatus");
    const Site = require("../model/site");

    const builder = await Builder.findOne({ userId: req.user.id });
    if (!builder) throw new Error("Builder not found");

    const [statuses, sites] = await Promise.all([
      LeadStatus.find({ builderId: builder._id, isDeleted: false }).sort({ order: 1 }),
      Site.find({ builderId: builder._id, isDeleted: false }).select("name"),
    ]);

    const stageNames = statuses.map(s => s.name);
    const siteNames = sites.map(s => s.name);
    const sourceOptions = ["WhatsApp", "Facebook", "Website", "Walk-in", "Referral"];

    // 10 empty rows so dropdowns are visible for user to fill
    const TOTAL_ROWS = 10;
    const sampleRows = [
      {
        "Name": "Rahul Sharma (Sample - delete this row)",
        "Phone": "9876543210",
        "Site": siteNames[0] || "",
        "Source": sourceOptions[0],
        "Budget": "50L - 80L",
        "Stage": stageNames[0] || "",
        "Notes": "Interested in 2BHK",
      },
      ...Array.from({ length: TOTAL_ROWS - 1 }, () => ({
        "Name": "", "Phone": "", "Site": "", "Source": "",
        "Budget": "", "Stage": "", "Notes": ""
      }))
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    ws["!cols"] = [
      { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
      { wch: 18 }, { wch: 22 }, { wch: 30 }
    ];

    // Add in-cell dropdown validations
    // Columns: A=Name, B=Phone, C=Site, D=Source, E=Budget, F=Stage, G=Notes
    if (siteNames.length > 0) addDropdownValidation(ws, "C", TOTAL_ROWS, siteNames);
    addDropdownValidation(ws, "D", TOTAL_ROWS, sourceOptions);
    if (stageNames.length > 0) addDropdownValidation(ws, "F", TOTAL_ROWS, stageNames);

    XLSX.utils.book_append_sheet(wb, ws, "Lead Import");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", "attachment; filename=lead_import_sample.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

// Import leads from Excel - returns failed rows as downloadable Excel
exports.importLeads = async (req, res) => {
  try {
    const Builder = require("../model/builder");
    const Lead = require("../model/lead");
    const LeadStatus = require("../model/leadStatus");
    const Site = require("../model/site");

    if (!req.file) throw new Error("No file uploaded");

    const builder = await Builder.findOne({ userId: req.user.id });
    if (!builder) throw new Error("Builder not found");

    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);

    if (!rows.length) throw new Error("Excel file is empty");

    const [statuses, sites] = await Promise.all([
      LeadStatus.find({ builderId: builder._id, isDeleted: false }),
      Site.find({ builderId: builder._id, isDeleted: false }),
    ]);

    const failedRows = [];   // original row data + error reason
    const leadsToInsert = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const name = row["Name"]?.toString().trim();
      const phone = row["Phone"]?.toString().trim();
      const siteName = row["Site"]?.toString().trim();
      const source = row["Source"]?.toString().trim();
      const budget = row["Budget"]?.toString().trim() || "";
      const stageName = row["Stage"]?.toString().trim();
      const notes = row["Notes"]?.toString().trim() || "";

      let errorReason = null;

      if (!name) errorReason = "Name is required";
      else if (!phone) errorReason = "Phone is required";
      else if (!siteName) errorReason = "Site is required";
      else if (!source) errorReason = "Source is required";
      else if (!stageName) errorReason = "Stage is required";
      else {
        const site = sites.find(s => s.name.toLowerCase() === siteName.toLowerCase());
        if (!site) errorReason = `Site "${siteName}" not found`;
        else {
          const validSources = ["WhatsApp", "Facebook", "Website", "Walk-in", "Referral"];
          if (!validSources.includes(source)) errorReason = `Invalid source "${source}"`;
          else {
            const stage = statuses.find(s => s.name.toLowerCase() === stageName.toLowerCase());
            if (!stage) errorReason = `Stage "${stageName}" not found`;
            else {
              leadsToInsert.push({
                builderId: builder._id,
                name, phone,
                siteId: site._id, siteName: site.name,
                source, budget,
                stageId: stage._id, stageName: stage.name,
                notes,
              });
            }
          }
        }
      }

      if (errorReason) {
        failedRows.push({
          "Row No": rowNum,
          "Name": name || "",
          "Phone": phone || "",
          "Site": siteName || "",
          "Source": source || "",
          "Budget": budget || "",
          "Stage": stageName || "",
          "Notes": notes || "",
          "Error Reason": errorReason,
        });
      }
    }

    if (leadsToInsert.length > 0) {
      await Lead.insertMany(leadsToInsert);
    }

    // If there are failed rows, return them as Excel file (base64)
    let failedExcelBase64 = null;
    if (failedRows.length > 0) {
      const failWs = XLSX.utils.json_to_sheet(failedRows);
      failWs["!cols"] = [
        { wch: 8 }, { wch: 22 }, { wch: 15 }, { wch: 25 }, { wch: 12 },
        { wch: 18 }, { wch: 22 }, { wch: 30 }, { wch: 40 }
      ];
      const failWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(failWb, failWs, "Failed Rows");
      failedExcelBase64 = XLSX.write(failWb, { type: "base64", bookType: "xlsx" });
    }

    return res.status(200).json({
      status: "Success",
      message: `${leadsToInsert.length} leads imported successfully${failedRows.length ? `, ${failedRows.length} rows failed` : ""}.`,
      imported: leadsToInsert.length,
      failedCount: failedRows.length,
      failedExcel: failedExcelBase64,  // base64 encoded xlsx
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};
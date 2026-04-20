const {
  createLeadService,
  fetchBuilderLeadsService,
  deleteLeadService,
  updateLeadService,
  getLeadByIdService,
  searchLeadsService,
  getLeadStatusesService,
  getStaffDropdownService,
  getSitesDropdownService,
  getSiteTeamMembersService,
  createFollowupService,
  getLeadFollowupsService,
  updateFollowupService,
  deleteFollowupService,
} = require("../service/lead");
const { resolveContext } = require("../utils/context");
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
    const site = req.query.site;
    const filterType = req.query.filterType; // 'my', 'team', or 'all'

    const { totalLeads, leadData } = await fetchBuilderLeadsService(req.user.id, { page, limit, search, status, source, agent, site, filterType });

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

exports.searchLeads = async (req, res) => {
  try {
    const leads = await searchLeadsService(req.user.id, req.query.q || '');
    return res.status(200).json({ status: "Success", data: leads });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
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
    const context = await resolveContext(req.user.id);
    const { builderId, staffId, role, isTeamLeader, managedStaffIds } = context;

    const Lead = require("../model/lead");
    const Reminder = require("../model/reminder");
    const mongoose = require("mongoose");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Prepare Lead Query
    let leadQuery = {
      builderId,
      isDeleted: false,
      createdAt: { $gte: today, $lt: tomorrow },
    };

    // Prepare Reminder Filter
    let reminderMatch = { 
      builderId: new mongoose.Types.ObjectId(builderId), 
      isActive: true, 
      isDeleted: false, 
      isSent: false 
    };

    if (role === 'STAFF') {
      const assignedIds = [staffId];
      if (isTeamLeader) {
        managedStaffIds.forEach(id => assignedIds.push(new mongoose.Types.ObjectId(id)));
      }
      
      // For leads count
      leadQuery.agentId = { $in: assignedIds };
      
      // For reminders count (need to filter through lead assignment)
      // This is more complex in aggregate, we'll add it to the pipeline
    }

    const leadsCountPromise = Lead.countDocuments(leadQuery);

    const reminderPipeline = [
      { $match: reminderMatch },
      { $lookup: { from: 'followups', localField: 'followupId', foreignField: '_id', as: 'followup' } },
      { $unwind: '$followup' },
      { $match: { 'followup.followupDate': { $gte: today, $lt: tomorrow } } },
      { $lookup: { from: 'leads', localField: 'leadId', foreignField: '_id', as: 'lead' } },
      { $unwind: '$lead' }
    ];

    if (role === 'STAFF') {
      const assignedIds = [staffId];
      if (isTeamLeader) {
        managedStaffIds.forEach(id => assignedIds.push(id));
      }
      reminderPipeline.push({
        $match: { 'lead.agentId': { $in: assignedIds.map(id => new mongoose.Types.ObjectId(id)) } }
      });
    }

    reminderPipeline.push({ $count: 'total' });

    const [leads, remindersResult] = await Promise.all([
      leadsCountPromise,
      Reminder.aggregate(reminderPipeline)
    ]);

    const reminders = remindersResult[0]?.total || 0;

    return res.status(200).json({ status: "Success", data: { leads, reminders } });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

// Reminder controllers
exports.getReminders = async (req, res) => {
  try {
    const context = await resolveContext(req.user.id);
    const { builderId, staffId, role, isTeamLeader, managedStaffIds } = context;

    const { status, page = 1, limit = 10 } = req.query;
    const numericLimit = parseInt(limit);
    const numericPage = parseInt(page);
    const skip = (numericPage - 1) * numericLimit;

    // Base match conditions
    let matchConditions = {
      builderId: builderId,
      isActive: true,
      isDeleted: false
    };

    if (status === 'completed') {
      // For completed, we don't strictly care about isSent (notification), 
      // but we filter by followup.isCompleted later in the pipeline
    } else {
      // For others, they should not be completed yet? 
      // Actually, let's remove isSent from base matchConditions and handle it in pipeline
    }
    delete matchConditions.isSent; 

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
      },
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
      }
    ];

    // Context-based filtering (Reminders jisko lead assign hui hogi usko dikhega)
    if (role === 'STAFF') {
      const assignedIds = [staffId];
      if (isTeamLeader) {
        // Team Leader sees their own and their team's reminders
        managedStaffIds.forEach(id => assignedIds.push(id));
      }
      
      pipeline.push({
        $match: {
          'lead.agentId': { $in: assignedIds }
        }
      });
    }

    // Add date and completion filtering based on followup
    if (status === 'completed') {
      pipeline.push({
        $match: {
          'followup.isCompleted': true
        }
      });
    } else {
      // Not completed
      pipeline.push({
        $match: {
          'followup.isCompleted': false
        }
      });

      if (status === 'missed') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        pipeline.push({
          $match: {
            'followup.followupDate': { $lt: today }
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        pipeline.push({
          $match: {
            'followup.followupDate': { $gte: tomorrow }
          }
        });
      }
    }

    // Add lookups for lead data
    pipeline.push(
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
        isSent: reminder.isSent, // notification sent
        isCompleted: followup?.isCompleted || false, // task completed
        sentAt: reminder.sentAt,
        type: 'Followup',
        priority: followup?.followupDate < new Date() && !followup?.isCompleted ? 'High' : 'Medium'
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
    const { builderId } = await resolveContext(req.user.id);

    const Followup = require("../model/followup");
    const reminder = await require("../model/reminder").findOne({
      _id: id,
      builderId,
      isDeleted: false
    });

    if (!reminder) throw new Error("Reminder not found");

    // Mark the linked followup as completed
    if (reminder.followupId) {
      await Followup.findByIdAndUpdate(reminder.followupId, {
        $set: { isCompleted: true, completedAt: new Date() }
      });
    }

    await require("../model/reminder").findByIdAndUpdate(id, {
      $set: { isSent: true, sentAt: new Date() }
    });

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

// (ExcelJS is used for downloadSampleExcel — no XLSX helper needed)

// Get dropdown data for sample Excel (sites, sources, stages)
exports.getSampleExcelData = async (req, res) => {
  try {
    const Builder = require("../model/builder");
    const LeadStatus = require("../model/leadStatus");
    const Site = require("../model/site");

    const builder = await Builder.findOne({ userId: req.user.id });
    if (!builder) throw new Error("Builder not found");

    const [statuses, sites] = await Promise.all([
      LeadStatus.find({ builderId: builder._id, isDeleted: false }).sort({ order: 1 }).select("_id name"),
      Site.find({ builderId: builder._id, isDeleted: false }).select("_id name"),
    ]);

    const sourceOptions = ["WhatsApp", "Facebook", "Website", "Walk-in", "Referral"];

    return res.status(200).json({
      status: "Success",
      data: {
        sites: sites.map(s => ({ _id: s._id, name: s.name })),
        sources: sourceOptions,
        stages: statuses.map(s => ({ _id: s._id, name: s.name })),
      }
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

// Download sample Excel with master-sheet dropdowns (ExcelJS)
exports.downloadSampleExcel = async (req, res) => {
  try {
    const ExcelJS = require("exceljs");
    const Builder = require("../model/builder");
    const LeadStatus = require("../model/leadStatus");
    const Site = require("../model/site");

    const builder = await Builder.findOne({ userId: req.user.id });
    if (!builder) throw new Error("Builder not found");

    const [statuses, sites] = await Promise.all([
      LeadStatus.find({ builderId: builder._id, isDeleted: false }).sort({ order: 1 }).lean(),
      Site.find({ builderId: builder._id, isDeleted: false }).select("name _id").lean(),
    ]);

    const SOURCE_OPTIONS = ["WhatsApp", "Facebook", "Website", "Walk-in", "Referral"];

    const workbook = new ExcelJS.Workbook();

    // ── Hidden master sheets (dropdown source data) ──────────────────────
    const siteSheet = workbook.addWorksheet("__sites", { state: "veryHidden" });
    siteSheet.addRows(sites.map(s => [s.name]));

    const sourceSheet = workbook.addWorksheet("__sources", { state: "veryHidden" });
    sourceSheet.addRows(SOURCE_OPTIONS.map(s => [s]));

    const stageSheet = workbook.addWorksheet("__stages", { state: "veryHidden" });
    stageSheet.addRows(statuses.map(s => [s.name]));

    // ── Main import sheet ─────────────────────────────────────────────────
    const sheet = workbook.addWorksheet("Lead Import");

    // Column definitions
    sheet.columns = [
      { header: "Name",   key: "name",   width: 28 },
      { header: "Phone",  key: "phone",  width: 16 },
      { header: "Site",   key: "site",   width: 24 },
      { header: "Source", key: "source", width: 16 },
      { header: "Budget", key: "budget", width: 18 },
      { header: "Stage",  key: "stage",  width: 22 },
      { header: "Notes",  key: "notes",  width: 32 },
    ];

    // Bold header row only
    sheet.getRow(1).font = { bold: true };

    // Sample row
    sheet.addRow({
      name:   "Rahul Sharma (Sample - delete this row)",
      phone:  "9876543210",
      site:   sites[0]?.name    || "",
      source: SOURCE_OPTIONS[0],
      budget: "50L - 80L",
      stage:  statuses[0]?.name || "",
      notes:  "Interested in 2BHK",
    });

    // ── Data-validation dropdowns for rows 2-1001 ─────────────────────────
    // Column index (1-based): Name=1, Phone=2, Site=3, Source=4, Budget=5, Stage=6, Notes=7
    const COL = { site: 3, source: 4, stage: 6 };

    const siteFormula   = `__sites!$A$1:$A$${sites.length   || 1}`;
    const sourceFormula = `__sources!$A$1:$A$${SOURCE_OPTIONS.length}`;
    const stageFormula  = `__stages!$A$1:$A$${statuses.length || 1}`;

    for (let row = 2; row <= 1001; row++) {
      if (sites.length > 0) {
        sheet.getCell(row, COL.site).dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: [siteFormula],
          showErrorMessage: true,
          errorTitle: "Invalid Site",
          error: "Please select a valid Site from the dropdown.",
        };
      }
      sheet.getCell(row, COL.source).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [sourceFormula],
        showErrorMessage: true,
        errorTitle: "Invalid Source",
        error: "Please select a valid Source from the dropdown.",
      };
      if (statuses.length > 0) {
        sheet.getCell(row, COL.stage).dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: [stageFormula],
          showErrorMessage: true,
          errorTitle: "Invalid Stage",
          error: "Please select a valid Stage from the dropdown.",
        };
      }
    }

    // Freeze header row
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    // Stream response
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="lead_import_template.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
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

    // Find "Lead Import" sheet by name; fallback to first non-hidden sheet
    const targetSheetName =
      wb.SheetNames.find(n => n === "Lead Import") ||
      wb.SheetNames.find(n => !n.startsWith("__")) ||
      wb.SheetNames[0];

    const ws = wb.Sheets[targetSheetName];
    const rows = XLSX.utils.sheet_to_json(ws);

    if (!rows.length) throw new Error("Excel file is empty or has no data rows");


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

      // Skip completely empty rows (template placeholder rows)
      if (!name && !phone && !siteName && !source && !stageName) continue;

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
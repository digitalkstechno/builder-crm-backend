const { resolveContext } = require("../utils/context");
const Lead = require("../model/lead");
const Followup = require("../model/followup");
const Site = require("../model/site");
const Staff = require("../model/staff");
const User = require("../model/user");

const getDateRange = (filter, customStart, customEnd) => {
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  switch (filter) {
    case "today":
      return { start: today, end: tomorrow };
    case "7days":
      return { start: new Date(today.getTime() - 7 * 86400000), end: tomorrow };
    case "30days":
      return { start: new Date(today.getTime() - 30 * 86400000), end: tomorrow };
    case "custom":
      return {
        start: new Date(customStart),
        end: new Date(new Date(customEnd).setHours(23, 59, 59, 999)),
      };
    default:
      return { start: new Date(today.getTime() - 30 * 86400000), end: tomorrow };
  }
};

exports.getReportStats = async (req, res) => {
  try {
    const context = await resolveContext(req.user.id);
    const { builderId, staffId, role, isTeamLeader, managedStaffIds } = context;

    const { filter = "30days", startDate, endDate } = req.query;
    const { start, end } = getDateRange(filter, startDate, endDate);

    let baseQuery = { builderId, isDeleted: false };
    if (role === "STAFF") {
      const ids = [staffId, ...(isTeamLeader ? managedStaffIds : [])];
      baseQuery.agentId = { $in: ids };
    }

    const rangeQuery = { ...baseQuery, createdAt: { $gte: start, $lt: end } };

    // Previous period for comparison
    const periodMs = end - start;
    const prevStart = new Date(start.getTime() - periodMs);
    const prevQuery = { ...baseQuery, createdAt: { $gte: prevStart, $lt: start } };

    const [
      totalLeads,
      prevLeads,
      allLeadsInRange,
      allSites,
      allStaff,
      followupsInRange,
    ] = await Promise.all([
      Lead.countDocuments(rangeQuery),
      Lead.countDocuments(prevQuery),
      Lead.find(rangeQuery, "stageName source agentId agentName siteId siteName createdAt").lean(),
      Site.find({ builderId, isDeleted: false }, "name status").lean(),
      Staff.find({ builderId, isDeleted: false }, "name _id userId").lean(),
      Followup.find({ builderId, createdAt: { $gte: start, $lt: end }, isDeleted: false }, "isCompleted leadId createdAt").lean(),
    ]);

    // Get staff user names
    const userIds = allStaff.map(s => s.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }, "fullName _id").lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u.fullName; });

    // Stage & source breakdown
    const stageCounts = {};
    const sourceCounts = {};
    const agentLeadMap = {}; // agentId -> count

    allLeadsInRange.forEach((l) => {
      stageCounts[l.stageName || "Unknown"] = (stageCounts[l.stageName || "Unknown"] || 0) + 1;
      sourceCounts[l.source || "Unknown"] = (sourceCounts[l.source || "Unknown"] || 0) + 1;
      if (l.agentId) {
        const key = l.agentId.toString();
        agentLeadMap[key] = (agentLeadMap[key] || 0) + 1;
      }
    });

    // Site performance — ALL sites with status
    const siteLeadMap = {};
    allLeadsInRange.forEach(l => {
      if (l.siteId) siteLeadMap[l.siteId.toString()] = (siteLeadMap[l.siteId.toString()] || 0) + 1;
    });

    const sitePerformance = allSites.map(s => ({
      label: s.name,
      count: siteLeadMap[s._id.toString()] || 0,
      status: s.status || "Planning",
    })).sort((a, b) => b.count - a.count);

    // Followup counts per lead -> per agent
    const leadAgentMap = {};
    allLeadsInRange.forEach(l => {
      if (l._id) leadAgentMap[l._id.toString()] = l.agentId?.toString();
    });

    const agentFollowupMap = {};   // agentId -> total followups
    const agentCompletedMap = {};  // agentId -> completed followups
    followupsInRange.forEach(f => {
      const agentId = leadAgentMap[f.leadId?.toString()];
      if (agentId) {
        agentFollowupMap[agentId] = (agentFollowupMap[agentId] || 0) + 1;
        if (f.isCompleted) agentCompletedMap[agentId] = (agentCompletedMap[agentId] || 0) + 1;
      }
    });

    // Staff performance — ALL staff
    const staffPerformance = allStaff.map(s => ({
      name: userMap[s.userId?.toString()] || s.name || "Unknown",
      leadsAssigned: agentLeadMap[s._id.toString()] || 0,
      followups: agentFollowupMap[s._id.toString()] || 0,
      completed: agentCompletedMap[s._id.toString()] || 0,
    })).sort((a, b) => b.leadsAssigned - a.leadsAssigned);

    const totalFollowups = followupsInRange.length;
    const completedFollowups = followupsInRange.filter(f => f.isCompleted).length;

    const leadChange = prevLeads > 0
      ? Math.round(((totalLeads - prevLeads) / prevLeads) * 100)
      : totalLeads > 0 ? 100 : 0;

    return res.status(200).json({
      status: "Success",
      data: {
        dateRange: { start: start.toISOString(), end: end.toISOString() },
        summary: {
          totalLeads,
          leadChange,
          conversionRate: totalLeads > 0 ? Math.round(((stageCounts["Closed"] || 0) / totalLeads) * 100) : 0,
          totalFollowups,
          completedFollowups,
          followupRate: totalFollowups > 0 ? Math.round((completedFollowups / totalFollowups) * 100) : 0,
          activeSites: allSites.filter(s => s.status === "Active").length,
          totalStaff: allStaff.length,
        },
        stageCounts: Object.entries(stageCounts)
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count),
        sourceCounts: Object.entries(sourceCounts)
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count),
        agentCounts: Object.entries(agentLeadMap)
          .map(([id, count]) => {
            const s = allStaff.find(st => st._id.toString() === id);
            return { label: userMap[s?.userId?.toString()] || s?.name || "Unknown", count };
          })
          .sort((a, b) => b.count - a.count),
        sitePerformance,
        staffPerformance,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

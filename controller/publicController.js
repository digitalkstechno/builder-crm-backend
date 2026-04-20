const Site = require("../model/site");
const User = require("../model/user");
const Lead = require("../model/lead");
const Builder = require("../model/builder");
const RequirementType = require("../model/requirementType");
const PropertyType = require("../model/propertyType");
const Budget = require("../model/budget");
const Team = require("../model/team");
const Staff = require("../model/staff");
const LeadStatus = require("../model/leadStatus");
const Notification = require("../model/notification");
const mongoose = require("mongoose");

const getDefaultStage = async (builderId) => {
  const status = await LeadStatus.findOne(
    { builderId, isDeleted: false },
    "_id name",
    { sort: { order: 1 } }
  );
  return status;
};

const getSiteById = async (req, res) => {
  try {
    const { siteId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(siteId))
      return res.status(400).json({ status: "Fail", message: "Invalid siteId" });

    const site = await Site.findOne({ _id: siteId, isDeleted: false, deleteRequested: false, isActive: true })
      .populate("propertyTypes", "name")
      .populate("requirementTypes", "name")
      .populate("budgets", "label minAmount maxAmount")
      .populate("builderId", "companyName address websiteDetails");

    if (!site) return res.status(404).json({ status: "Fail", message: "Site not found" });

    return res.status(200).json({ status: "Success", data: site });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

const getBuilderCities = async (req, res) => {
  try {
    const { builderId } = req.params;
    console.log("DEBUG: getBuilderCities : builderId:", builderId);

    if (!mongoose.Types.ObjectId.isValid(builderId))
      return res.status(400).json({ status: "Fail", message: "Invalid builderId" });

    const { requirementType, propertyType, budget } = req.query;
    console.log("DEBUG: getBuilderCities : query:", { requirementType, propertyType, budget });

    const siteQuery = {
      builderId: new mongoose.Types.ObjectId(builderId),
      isDeleted: false,
      deleteRequested: false,
      isActive: true,
    };

    if (requirementType) {
      const rt = await RequirementType.findOne({ builderId, name: { $regex: new RegExp(`^${requirementType}$`, "i") }, isDeleted: false }, "_id");
      console.log("DEBUG: getBuilderCities : rt found:", rt);
      if (!rt) return res.status(200).json({ status: "Success", data: [] });
      siteQuery.requirementTypes = rt._id;
    }

    if (propertyType) {
      const pt = await PropertyType.findOne({ builderId, name: { $regex: new RegExp(`^${propertyType}$`, "i") }, isDeleted: false }, "_id");
      console.log("DEBUG: getBuilderCities : pt found:", pt);
      if (!pt) return res.status(200).json({ status: "Success", data: [] });
      siteQuery.propertyTypes = pt._id;
    }

    if (budget) {
      const b = await Budget.findOne({ builderId, label: { $regex: new RegExp(`^${budget}$`, "i") }, isDeleted: false }, "_id");
      console.log("DEBUG: getBuilderCities : b found:", b);
      if (!b) return res.status(200).json({ status: "Success", data: [] });
      siteQuery.budgets = b._id;
    }

    console.log("DEBUG: getBuilderCities : executing aggregate match:", JSON.stringify(siteQuery));
    const results = await Site.aggregate([
      { $match: siteQuery },
      { $group: { _id: "$city" } },
      { $sort: { _id: 1 } },
    ]);
    console.log("DEBUG: getBuilderCities : results:", results);

    const data = results.map((r, i) => ({ _id: i + 1, name: r._id }));

    return res.status(200).json({ status: "Success", data });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

const getBuilderCityAreas = async (req, res) => {
  try {
    const { builderId, city } = req.params;
    console.log("DEBUG: getBuilderCityAreas : builderId:", builderId, "city:", city);

    if (!mongoose.Types.ObjectId.isValid(builderId))
      return res.status(400).json({ status: "Fail", message: "Invalid builderId" });

    const { requirementType, propertyType, budget } = req.query;
    console.log("DEBUG: getBuilderCityAreas : query:", { requirementType, propertyType, budget });

    const siteQuery = {
      builderId: new mongoose.Types.ObjectId(builderId),
      city: { $regex: new RegExp(`^${city}$`, "i") },
      isDeleted: false,
      deleteRequested: false,
      isActive: true,
    };

    if (requirementType) {
      const rt = await RequirementType.findOne({ builderId, name: { $regex: new RegExp(`^${requirementType}$`, "i") }, isDeleted: false }, "_id");
      console.log("DEBUG: getBuilderCityAreas : rt found:", rt);
      if (!rt) return res.status(200).json({ status: "Success", data: [] });
      siteQuery.requirementTypes = rt._id;
    }

    if (propertyType) {
      const pt = await PropertyType.findOne({ builderId, name: { $regex: new RegExp(`^${propertyType}$`, "i") }, isDeleted: false }, "_id");
      console.log("DEBUG: getBuilderCityAreas : pt found:", pt);
      if (!pt) return res.status(200).json({ status: "Success", data: [] });
      siteQuery.propertyTypes = pt._id;
    }

    if (budget) {
      const b = await Budget.findOne({ builderId, label: { $regex: new RegExp(`^${budget}$`, "i") }, isDeleted: false }, "_id");
      console.log("DEBUG: getBuilderCityAreas : b found:", b);
      if (!b) return res.status(200).json({ status: "Success", data: [] });
      siteQuery.budgets = b._id;
    }

    console.log("DEBUG: getBuilderCityAreas : executing aggregate match:", JSON.stringify(siteQuery));
    const results = await Site.aggregate([
      { $match: siteQuery },
      { $group: { _id: "$area" } },
      { $sort: { _id: 1 } },
    ]);
    console.log("DEBUG: getBuilderCityAreas : results:", results);

    const data = results.map((r, i) => ({ _id: i + 1, name: r._id }));

    return res.status(200).json({ status: "Success", data });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

const getUserIdByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const user = await User.findOne({ phone, isDeleted: false }, "_id builderId role");
    if (!user) return res.status(404).json({ status: "Fail", message: "User not found" });

    let builderId = user.builderId;
    if (user.role === "BUILDER") {
      const builder = await Builder.findOne({ userId: user._id, isDeleted: false }, "_id");
      builderId = builder ? builder._id : null;
    }

    return res.status(200).json({ status: "Success", data: { _id: user._id, builderId } });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

const createPublicLead = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return res.status(401).json({ status: "Fail", message: "Unauthorized" });
    }

    const base64 = authHeader.split(" ")[1];
    const [username, password] = Buffer.from(base64, "base64").toString().split(":");

    if (username !== process.env.BASIC_AUTH_USER || password !== process.env.BASIC_AUTH_PASS) {
      return res.status(401).json({ status: "Fail", message: "Invalid credentials" });
    }

    const { name, phone, bid, siteId, requirementType, propertyType, budget, city, area } = req.body;
    const builderId = bid;
    console.log("DEBUG : createPublicLead : req.body:", req.body);

    if (!name || !phone) {
      return res.status(400).json({ status: "Fail", message: "name and phone are required" });
    }

    if (builderId && !mongoose.Types.ObjectId.isValid(builderId))
      return res.status(400).json({ status: "Fail", message: "Invalid builderId" });

    if (siteId && !mongoose.Types.ObjectId.isValid(siteId))
      return res.status(400).json({ status: "Fail", message: "Invalid siteId" });

    const leadData = {
      name,
      phone,
      source: "WhatsApp",
      ...(builderId && { builderId }),
      ...(siteId && { siteId }),
      ...(budget && { budget }),
      ...(city && { city }),
      ...(area && { area }),
      ...(requirementType && { requirementType }),
      ...(propertyType && { propertyType }),
    };

    // Site se teamId nikalo aur team leader assign karo
    if (siteId) {
      const site = await Site.findById(siteId, "name teamId");
      if (site) {
        leadData.siteName = site.name;
        if (site.teamId) {
          const team = await Team.findOne({ _id: site.teamId, isDeleted: false }, "leaderId");
          if (team && team.leaderId) {
            const leaderStaff = await Staff.findById(team.leaderId, "userId");
            if (leaderStaff) {
              const leaderUser = await User.findById(leaderStaff.userId, "fullName");
              leadData.agentId = team.leaderId;
              leadData.agentName = leaderUser ? leaderUser.fullName : null;
            }
          }
        }
      }
    }

    if (builderId) {
      const defaultStage = await getDefaultStage(builderId);
      if (defaultStage) {
        leadData.stageId = defaultStage._id;
        leadData.stageName = defaultStage.name;
      }
    }

    const lead = await Lead.create(leadData);
    return res.status(201).json({ status: "Success", data: lead });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

const getBuilderRequirementTypes = async (req, res) => {
  try {
    const { builderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(builderId))
      return res.status(400).json({ status: "Fail", message: "Invalid builderId" });

    const sites = await Site.find(
      { builderId: new mongoose.Types.ObjectId(builderId), isDeleted: false, deleteRequested: false, isActive: true },
      "requirementTypes"
    );

    const uniqueIds = [...new Set(sites.flatMap((s) => s.requirementTypes.map((id) => id.toString())))];

    const requirementTypes = await RequirementType.find(
      { _id: { $in: uniqueIds }, isDeleted: false },
      "_id name"
    );

    return res.status(200).json({ status: "Success", data: requirementTypes });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

const getBuilderPropertyTypes = async (req, res) => {
  try {
    const { builderId } = req.params;
    console.log("DEBUG: getBuilderPropertyTypes : builderId:", builderId);

    if (!mongoose.Types.ObjectId.isValid(builderId))
      return res.status(400).json({ status: "Fail", message: "Invalid builderId" });

    const { requirementType } = req.query;
    console.log("DEBUG: getBuilderPropertyTypes : requirementType query:", requirementType);

    const siteQuery = {
      builderId: new mongoose.Types.ObjectId(builderId),
      isDeleted: false,
      deleteRequested: false,
      isActive: true
    };

    if (requirementType) {
      const rt = await RequirementType.findOne({ builderId, name: { $regex: new RegExp(`^${requirementType}$`, "i") }, isDeleted: false }, "_id");
      console.log("DEBUG: getBuilderPropertyTypes : rt found:", rt);
      if (!rt) return res.status(200).json({ status: "Success", data: [] });
      siteQuery.requirementTypes = rt._id;
    }

    console.log("DEBUG: getBuilderPropertyTypes : executing siteQuery:", JSON.stringify(siteQuery));
    const sites = await Site.find(siteQuery, "propertyTypes");
    console.log("DEBUG: getBuilderPropertyTypes : sites count found:", sites.length);

    const uniqueIds = [...new Set(sites.flatMap((s) => s.propertyTypes.map((id) => id.toString())))];
    console.log("DEBUG: getBuilderPropertyTypes : unique PropertyType IDs:", uniqueIds);

    const propertyTypes = await PropertyType.find(
      { _id: { $in: uniqueIds }, isDeleted: false },
      "_id name"
    );
    console.log("DEBUG: getBuilderPropertyTypes : final propertyTypes count:", propertyTypes.length);

    return res.status(200).json({ status: "Success", data: propertyTypes });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

const getBuilderPublicProfile = async (req, res) => {
  try {
    const { builderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(builderId))
      return res.status(400).json({ status: "Fail", message: "Invalid builderId" });

    const builder = await Builder.findOne({ _id: builderId, isDeleted: false, isActive: true }, "companyName address websiteDetails");
    if (!builder) return res.status(404).json({ status: "Fail", message: "Builder not found" });

    const sites = await Site.find(
      { builderId, isDeleted: false, deleteRequested: false, isActive: true },
      "name city area images status"
    );

    return res.status(200).json({ status: "Success", data: { builder, sites } });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

const getBuilderSites = async (req, res) => {
  try {
    const { builderId } = req.params;
    console.log("DEBUG: getBuilderSites : builderId:", builderId);

    if (!mongoose.Types.ObjectId.isValid(builderId))
      return res.status(400).json({ status: "Fail", message: "Invalid builderId" });

    const { requirementType, propertyType, budget, city, area } = req.query;
    console.log("DEBUG: getBuilderSites : query params:", { requirementType, propertyType, budget, city, area });

    const query = {
      builderId: new mongoose.Types.ObjectId(builderId),
      isDeleted: false,
      deleteRequested: false,
      isActive: true,
    };

    if (requirementType) {
      const rt = await RequirementType.findOne({ builderId, name: { $regex: new RegExp(`^${requirementType}$`, "i") }, isDeleted: false }, "_id");
      console.log("DEBUG: getBuilderSites : rt found:", rt);
      if (!rt) return res.status(200).json({ status: "Success", data: [] });
      query.requirementTypes = rt._id;
    }

    if (propertyType) {
      const pt = await PropertyType.findOne({ builderId, name: { $regex: new RegExp(`^${propertyType}$`, "i") }, isDeleted: false }, "_id");
      console.log("DEBUG: getBuilderSites : pt found:", pt);
      if (!pt) {
        const allPTs = await PropertyType.find({ builderId, isDeleted: false }, "name");
        console.log("DEBUG: getBuilderSites : PropertyType '" + propertyType + "' not found. Available types for this builder:", allPTs);
        return res.status(200).json({ status: "Success", data: [] });
      }
      query.propertyTypes = pt._id;
    }

    if (budget) {
      const b = await Budget.findOne({ builderId, label: { $regex: new RegExp(`^${budget}$`, "i") }, isDeleted: false }, "_id");
      console.log("DEBUG: getBuilderSites : b found:", b);
      if (!b) return res.status(200).json({ status: "Success", data: [] });
      query.budgets = b._id;
    }

    if (city) query.city = { $regex: new RegExp(`^${city}$`, "i") };
    if (area) query.area = { $regex: new RegExp(`^${area}$`, "i") };

    console.log("DEBUG: getBuilderSites : executing final query:", JSON.stringify(query));
    const sites = await Site.find(query, "name description images");
    console.log("DEBUG: getBuilderSites : sites found count:", sites.length);

    const data = sites.map((s) => {
      const obj = s.toObject();
      if (obj.description) {
        obj.description = obj.description
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, " ")
          .trim();
      }
      if (obj.images) {
        obj.images = obj.images.map((img) => `${process.env.API_BASE_URL}${img}`);
      }
      return obj;
    });

    return res.status(200).json({ status: "Success", data });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

const getBuilderBudgets = async (req, res) => {
  try {
    const { builderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(builderId))
      return res.status(400).json({ status: "Fail", message: "Invalid builderId" });

    const { requirementType, propertyType } = req.query;

    const siteQuery = {
      builderId: new mongoose.Types.ObjectId(builderId),
      isDeleted: false,
      deleteRequested: false,
      isActive: true
    };

    if (requirementType) {
      const rt = await RequirementType.findOne({ builderId, name: { $regex: new RegExp(`^${requirementType}$`, "i") }, isDeleted: false }, "_id");
      if (!rt) return res.status(200).json({ status: "Success", data: [] });
      siteQuery.requirementTypes = rt._id;
    }

    if (propertyType) {
      const pt = await PropertyType.findOne({ builderId, name: { $regex: new RegExp(`^${propertyType}$`, "i") }, isDeleted: false }, "_id");
      if (!pt) return res.status(200).json({ status: "Success", data: [] });
      siteQuery.propertyTypes = pt._id;
    }

    const sites = await Site.find(siteQuery, "budgets");

    const uniqueIds = [...new Set(sites.flatMap((s) => s.budgets.map((id) => id.toString())))];

    const budgets = await Budget.find(
      { _id: { $in: uniqueIds }, isDeleted: false },
      "_id label minAmount maxAmount"
    );

    return res.status(200).json({ status: "Success", data: budgets });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

const createPublicLeadWithDetails = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return res.status(401).json({ status: "Fail", message: "Unauthorized" });
    }

    const base64 = authHeader.split(" ")[1];
    const [username, password] = Buffer.from(base64, "base64").toString().split(":");

    if (username !== process.env.BASIC_AUTH_USER || password !== process.env.BASIC_AUTH_PASS) {
      return res.status(401).json({ status: "Fail", message: "Invalid credentials" });
    }

    const { builderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(builderId))
      return res.status(400).json({ status: "Fail", message: "Invalid builderId" });

    const { name, phone, siteId, requirementType, propertyType, budget, city, area } = req.body;
    if (!name || !phone)
      return res.status(400).json({ status: "Fail", message: "name and phone are required" });

    if (siteId && !mongoose.Types.ObjectId.isValid(siteId))
      return res.status(400).json({ status: "Fail", message: "Invalid siteId" });

    const leadData = {
      name,
      phone,
      source: "WhatsApp",
      builderId,
      ...(siteId && { siteId }),
      ...(budget && { budget }),
      ...(requirementType && mongoose.Types.ObjectId.isValid(requirementType) && { requirementType }),
      ...(propertyType && mongoose.Types.ObjectId.isValid(propertyType) && { propertyType }),
    };

    if (siteId) {
      const site = await Site.findById(siteId, "name teamId");
      if (site) {
        leadData.siteName = site.name;
        if (site.teamId) {
          const team = await Team.findOne({ _id: site.teamId, isDeleted: false }, "leaderId");
          if (team && team.leaderId) {
            const leaderStaff = await Staff.findById(team.leaderId, "userId");
            if (leaderStaff) {
              const leaderUser = await User.findById(leaderStaff.userId, "fullName");
              leadData.agentId = team.leaderId;
              leadData.agentName = leaderUser ? leaderUser.fullName : null;
            }
          }
        }
      }
    }

    const defaultStage = await getDefaultStage(builderId);
    if (defaultStage) {
      leadData.stageId = defaultStage._id;
      leadData.stageName = defaultStage.name;
    }

    const lead = await Lead.create(leadData);
    return res.status(201).json({ status: "Success", data: lead });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

const updatePublicLeadWithDetails = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return res.status(401).json({ status: "Fail", message: "Unauthorized" });
    }

    const base64 = authHeader.split(" ")[1];
    const [username, password] = Buffer.from(base64, "base64").toString().split(":");

    if (username !== process.env.BASIC_AUTH_USER || password !== process.env.BASIC_AUTH_PASS) {
      return res.status(401).json({ status: "Fail", message: "Invalid credentials" });
    }

    const { builderId, leadId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(builderId))
      return res.status(400).json({ status: "Fail", message: "Invalid builderId" });
    if (!mongoose.Types.ObjectId.isValid(leadId))
      return res.status(400).json({ status: "Fail", message: "Invalid leadId" });

    const { siteId, requirementType, propertyType, budget, city, area, site } = req.body;

    if (siteId && !mongoose.Types.ObjectId.isValid(siteId))
      return res.status(400).json({ status: "Fail", message: "Invalid siteId" });

    const updateData = {
      ...(budget && { budget }),
      ...(requirementType && mongoose.Types.ObjectId.isValid(requirementType) && { requirementType }),
      ...(propertyType && mongoose.Types.ObjectId.isValid(propertyType) && { propertyType }),
    };

    const resolvedSiteId = siteId || (site ? (await Site.findOne({ name: { $regex: new RegExp(`^${site}$`, "i") }, builderId, isDeleted: false }, "_id"))?.id : null);

    if (resolvedSiteId) {
      const siteDoc = await Site.findById(resolvedSiteId, "name teamId");
      if (siteDoc) {
        updateData.siteId = resolvedSiteId;
        updateData.siteName = siteDoc.name;
        if (siteDoc.teamId) {
          const team = await Team.findOne({ _id: siteDoc.teamId, isDeleted: false }, "leaderId");
          if (team && team.leaderId) {
            const leaderStaff = await Staff.findById(team.leaderId, "userId");
            if (leaderStaff) {
              const leaderUser = await User.findById(leaderStaff.userId, "fullName");
              updateData.agentId = team.leaderId;
              updateData.agentName = leaderUser ? leaderUser.fullName : null;
            }
          }
        }
      }
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: leadId, builderId, isDeleted: false },
      updateData,
      { new: true }
    );

    if (!lead) return res.status(404).json({ status: "Fail", message: "Lead not found" });

    return res.status(200).json({ status: "Success", data: lead });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

const createInquiry = async (req, res) => {
  try {
    const { name, phone, siteId, builderId, message } = req.body;

    if (!name || !phone || !siteId || !builderId) {
      return res.status(400).json({ status: "Fail", message: "name, phone, siteId and builderId are required" });
    }

    const leadData = {
      name,
      phone,
      source: "Website",
      builderId,
      siteId,
      notes: message
    };

    // Find site to get team info
    const site = await Site.findById(siteId, "name teamId");
    if (site) {
      leadData.siteName = site.name;
      if (site.teamId) {
        const team = await Team.findOne({ _id: site.teamId, isDeleted: false }, "leaderId");
        if (team && team.leaderId) {
          const leaderStaff = await Staff.findById(team.leaderId, "userId");
          if (leaderStaff) {
            const leaderUser = await User.findById(leaderStaff.userId, "fullName");
            leadData.agentId = team.leaderId;
            leadData.agentName = leaderUser ? leaderUser.fullName : null;
          }
        }
      }
    }

    // Default stage
    const defaultStage = await getDefaultStage(builderId);
    if (defaultStage) {
      leadData.stageId = defaultStage._id;
      leadData.stageName = defaultStage.name;
    }

    const lead = await Lead.create(leadData);
    
    // Notify Builder/Agent via Socket if needed
    if (leadData.agentId) {
        const { getIO } = require("../utils/socket");
        const io = getIO();
        const notification = new Notification({
            title: "New Website Inquiry",
            message: `New inquiry for "${leadData.siteName}" from ${name}.`,
            type: "lead_assigned",
            leadId: lead._id,
            builderId,
            recipientId: leadData.agentId.userId, // This might need mapping to userId
            targetRole: "STAFF"
        });
        // Note: leadData.agentId is Staff ID. We need userId for socket.
        // Above I already found leaderStaff which has userId.
        const staff = await Staff.findById(leadData.agentId).populate('userId');
        if (staff && staff.userId) {
            notification.recipientId = staff.userId._id;
            await notification.save();
            io.to(staff.userId._id.toString()).emit("newLeadAssigned", {
                notification,
                leadName: name
            });
        }
    }

    return res.status(201).json({ status: "Success", data: lead });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

module.exports = {
  createInquiry,
  getSiteById,
  getBuilderCities,
  getBuilderCityAreas,
  getUserIdByPhone,
  createPublicLead,
  getBuilderRequirementTypes,
  getBuilderPropertyTypes,
  getBuilderBudgets,
  getBuilderSites,
  getBuilderPublicProfile,
  createPublicLeadWithDetails,
  updatePublicLeadWithDetails,
};

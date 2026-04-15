const Site = require("../model/site");
const Builder = require("../model/builder");
const fs = require("fs");
const path = require("path");
const { getIO } = require("../utils/socket");
const Notification = require("../model/notification");
const mongoose = require("mongoose");


exports.createSiteService = async (builderUserId, siteData) => {
  const { name, city, area, description, propertyTypes, requirementTypes, budgets, priceRange, whatsappNumber, staff, teamId, status, images } = siteData;

  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  // Check site limit
  const currentSiteCount = await Site.countDocuments({ builderId: builder._id, isDeleted: false });
  if (currentSiteCount >= builder.currentLimits.noOfSites) {
    throw new Error(`Site limit exceeded. You can only create ${builder.currentLimits.noOfSites} sites.`);
  }

  const newSite = new Site({
    builderId: builder._id,
    name,
    city,
    area,
    description,
    propertyTypes: (propertyTypes || []).map(id => new mongoose.Types.ObjectId(id)),
    requirementTypes: (requirementTypes || []).map(id => new mongoose.Types.ObjectId(id)),
    budgets: (budgets || []).map(id => new mongoose.Types.ObjectId(id)),
    priceRange,
    whatsappNumber,
    staff,
    teamId,
    status,
    images,
  });

  await newSite.save();

  // If whatsappNumber is added, notify admin
  if (whatsappNumber) {
    const notification = new Notification({
      title: "New Site WhatsApp Added",
      message: `A new site "${name}" has been created with WhatsApp number ${whatsappNumber}.`,
      type: "site_added",
      siteId: newSite._id,
      builderId: builder._id,
    });
    await notification.save();

    const io = getIO();
    const populatedSite = await Site.findById(newSite._id).populate("builderId", "companyName");
    io.emit("admin_notification", {
      notification,
      site: populatedSite,
    });
    
    // Also emit specifically for the whatsapp page update
    io.emit("whatsapp_page_update", {
      action: "add",
      site: populatedSite,
    });
  }

  return newSite;
};

exports.fetchBuilderSitesService = async (builderUserId, { page, limit, search }) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const skip = (page - 1) * limit;

  let query = { builderId: builder._id, isDeleted: false, deleteRequested: false };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { area: { $regex: search, $options: "i" } }
    ];
  }

  const totalSites = await Site.countDocuments(query);
  const siteData = await Site.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate('requirementTypes', 'name')
    .populate('propertyTypes', 'name')
    .populate('budgets', 'label minAmount maxAmount');

  return { totalSites, siteData };
};

exports.deleteSiteService = async (siteId, builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const site = await Site.findOne({ _id: siteId, builderId: builder._id });
  if (!site) throw new Error("Site not found");

  site.deleteRequested = true;
  await site.save();

  const populatedSite = await Site.findById(site._id).populate("builderId", "companyName");
  const { getIO } = require("../utils/socket");
  const io = getIO();

  // Create notification for admin
  const notification = new Notification({
    title: "Site Delete Requested",
    message: `Site "${site.name}" deletion has been requested by ${builder.companyName}. Review and Unlink WhatsApp in Hub.`,
    type: "site_deleted",
    builderId: builder._id,
    siteId: site._id
  });
  await notification.save();

  io.emit("admin_notification", {
    notification,
    site: populatedSite,
  });

  io.emit("whatsapp_page_update", {
    action: "update",
    site: populatedSite,
  });
};

exports.updateSiteService = async (siteId, builderUserId, updateData, keptImages = []) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const site = await Site.findOne({ _id: siteId, builderId: builder._id, isDeleted: false });
  if (!site) throw new Error("Site not found");

  // Find images to delete (original images not in keptImages)
  const imagesToDelete = site.images.filter(img => !keptImages.includes(img));

  // Delete images that are no longer kept
  if (imagesToDelete.length > 0) {
    imagesToDelete.forEach((imagePath) => {
      const fullPath = path.join(__dirname, '..', 'public', imagePath);
      fs.unlink(fullPath, (err) => {
        if (err) console.error('Error deleting removed image:', err);
      });
    });
  }

  const updatedSite = await Site.findByIdAndUpdate(
    siteId,
    { $set: { 
      ...updateData, 
      propertyTypes: (updateData.propertyTypes || []).map(id => new mongoose.Types.ObjectId(id)),
      requirementTypes: (updateData.requirementTypes || []).map(id => new mongoose.Types.ObjectId(id)),
      budgets: (updateData.budgets || []).map(id => new mongoose.Types.ObjectId(id)),
    } },
    { new: true }
  ).populate('requirementTypes', 'name').populate('propertyTypes', 'name').populate('budgets', 'label minAmount maxAmount');

  // Check if whatsappNumber was changed or added
  if (updateData.whatsappNumber && updateData.whatsappNumber !== site.whatsappNumber) {
    const notification = new Notification({
      title: "Site WhatsApp Updated",
      message: `Site "${updatedSite.name}" updated its WhatsApp number to ${updateData.whatsappNumber}.`,
      type: "whatsapp_updated",
      siteId: updatedSite._id,
      builderId: builder._id,
    });
    await notification.save();

    const io = getIO();
    const populatedSite = await Site.findById(updatedSite._id).populate("builderId", "companyName");
    io.emit("admin_notification", {
      notification,
      site: populatedSite,
    });

    // Also emit specifically for the whatsapp page update
    io.emit("whatsapp_page_update", {
      action: "update",
      site: populatedSite,
    });
  }

  // Emit to builder specifically if status changed (for real-time table update)
  if (updateData.whatsappStatus || updateData.chatbotStatus) {
    const io = getIO();
    io.emit("site_status_update", {
      siteId: updatedSite._id,
      whatsappStatus: updatedSite.whatsappStatus,
      chatbotStatus: updatedSite.chatbotStatus,
    });
  }

  return updatedSite;
};

exports.getSiteByIdService = async (siteId, builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const site = await Site.findOne({ _id: siteId, builderId: builder._id, isDeleted: false })
    .populate('requirementTypes', 'name')
    .populate('propertyTypes', 'name')
    .populate('budgets', 'label minAmount maxAmount');
  if (!site) throw new Error("Site not found");

  return site;
};

exports.getAllSitesForAdminService = async () => {
  return await Site.find({})
    .populate("builderId", "companyName")
    .sort({ createdAt: -1 });
};

exports.updateSiteStatusService = async (siteId, statusData) => {
  const updatedSite = await Site.findByIdAndUpdate(
    siteId,
    { $set: statusData },
    { new: true }
  ).populate("builderId", "companyName");

  if (!updatedSite) throw new Error("Site not found");

  const io = getIO();
  io.emit("site_status_update", {
    siteId: updatedSite._id,
    whatsappStatus: updatedSite.whatsappStatus,
    chatbotStatus: updatedSite.chatbotStatus,
  });

  return updatedSite;
};

exports.getSiteByWhatsappIdService = async (whatsappId) => {
  const site = await Site.findOne({ whatsappStatus:whatsappId, isDeleted: false });
  if (!site) throw new Error("Site not found");

  return site;
};
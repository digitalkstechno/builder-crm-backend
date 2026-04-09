const Site = require("../model/site");
const Builder = require("../model/builder");
const fs = require("fs");
const path = require("path");

exports.createSiteService = async (builderUserId, siteData) => {
  const { name, city, area, description, propertyTypes, priceRange, whatsappNumber, staff, teamId, status, images } = siteData;

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
    propertyTypes,
    priceRange,
    whatsappNumber,
    staff,
    teamId,
    status,
    images,
  });

  await newSite.save();
  return newSite;
};

exports.fetchBuilderSitesService = async (builderUserId, { page, limit, search }) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const skip = (page - 1) * limit;

  let query = { builderId: builder._id, isDeleted: false };
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
    .sort({ createdAt: -1 });

  return { totalSites, siteData };
};

exports.deleteSiteService = async (siteId, builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const site = await Site.findOne({ _id: siteId, builderId: builder._id });
  if (!site) throw new Error("Site not found");

  // Delete associated images
  if (site.images && site.images.length > 0) {
    site.images.forEach((imagePath) => {
      const fullPath = path.join(__dirname, '..', 'public', imagePath);
      fs.unlink(fullPath, (err) => {
        if (err) console.error('Error deleting image:', err);
      });
    });
  }

  site.isDeleted = true;
  await site.save();
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
    { $set: updateData },
    { new: true }
  );

  return updatedSite;
};

exports.getSiteByIdService = async (siteId, builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const site = await Site.findOne({ _id: siteId, builderId: builder._id, isDeleted: false });
  if (!site) throw new Error("Site not found");

  return site;
};
const LeadStatus = require("../model/leadStatus");
const Builder = require("../model/builder");

const DEFAULT_STATUSES = [
  { name: "New Lead", key: "NEW", color: "#6366f1", order: 1 },
  { name: "Won", key: "WON", color: "#10b981", order: 2 },
  { name: "Lost", key: "LOST", color: "#ef4444", order: 3 },
];

exports.fetchLeadStatusesService = async (builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  let statuses = await LeadStatus.find({ builderId: builder._id, isDeleted: false }).sort({ order: 1 });

  // Seed defaults if empty
  if (statuses.length === 0) {
    const seedData = DEFAULT_STATUSES.map((s) => ({
      ...s,
      builderId: builder._id,
    }));
    statuses = await LeadStatus.insertMany(seedData);
  }

  return statuses;
};

exports.updateLeadStatusService = async (statusId, builderUserId, updateData) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const status = await LeadStatus.findOne({ _id: statusId, builderId: builder._id });
  if (!status) throw new Error("Status not found");

  // Prevent changing keys for system statuses if needed, but here we allow name/color/order change
  return await LeadStatus.findByIdAndUpdate(statusId, updateData, { new: true });
};

exports.reorderStatusesService = async (builderUserId, orderings) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  // orderings: [{ id: statusId, order: 1 }, ...]
  const promises = orderings.map((item) =>
    LeadStatus.findOneAndUpdate(
      { _id: item.id, builderId: builder._id },
      { order: item.order }
    )
  );

  await Promise.all(promises);
};

exports.createLeadStatusService = async (builderUserId, statusData) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const lastStatus = await LeadStatus.findOne({ builderId: builder._id, isDeleted: false }).sort({ order: -1 });
  const nextOrder = lastStatus ? lastStatus.order + 1 : 1;

  const newStatus = new LeadStatus({
    ...statusData,
    builderId: builder._id,
    order: nextOrder
  });

  return await newStatus.save();
};

exports.deleteLeadStatusService = async (statusId, builderUserId) => {
    const builder = await Builder.findOne({ userId: builderUserId });
    if (!builder) throw new Error("Builder not found");
  
    const status = await LeadStatus.findOne({ _id: statusId, builderId: builder._id });
    if (!status) throw new Error("Status not found");

    // Protection for critical statuses
    if (['NEW', 'WON', 'LOST'].includes(status.key)) {
        throw new Error("System default statuses cannot be deleted.");
    }
  
    status.isDeleted = true;
    await status.save();
};

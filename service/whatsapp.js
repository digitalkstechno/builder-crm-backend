const Whatsapp = require("../model/whatsapp");
const Builder = require("../model/builder");
const Notification = require("../model/notification");
const User = require("../model/user");
const { getIO } = require("../utils/socket");

exports.createWhatsappService = async (builderUserId, { name, number }) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  let formattedNumber = "91" + number.replace(/\D/g, "");

  const currentCount = await Whatsapp.countDocuments({ builderId: builder._id, isDeleted: false });
  if (currentCount >= builder.currentLimits.noOfWhatsapp) {
    throw new Error(`WhatsApp limit reached. Max: ${builder.currentLimits.noOfWhatsapp}`);
  }

  const newWhatsapp = new Whatsapp({
    name,
    number: formattedNumber,
    builderId: builder._id,
  });
  await newWhatsapp.save();

  // Notify admin
  const notification = new Notification({
    title: "New WhatsApp Hub Added",
    message: `Builder "${builder.companyName}" added a new WhatsApp number: ${formattedNumber}.`,
    type: "whatsapp_added",
    builderId: builder._id,
    targetRole: "ADMIN"
  });
  await notification.save();

  const io = getIO();
  const populatedWhatsapp = await Whatsapp.findById(newWhatsapp._id).populate("builderId", "companyName");
  
  const admins = await User.find({ role: "ADMIN", isDeleted: false }, "_id");
  admins.forEach(admin => {
    io.to(admin._id.toString()).emit("admin_notification", {
      notification,
      whatsapp: populatedWhatsapp,
    });
  });
  
  io.emit("whatsapp_page_update", {
    action: "add",
    whatsapp: populatedWhatsapp,
  });

  return newWhatsapp;
};

exports.fetchBuilderWhatsappService = async (builderUserId, { page = 1, limit = 10, search = "" }) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const skip = (page - 1) * limit;
  let query = { builderId: builder._id, isDeleted: false };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { number: { $regex: search, $options: "i" } },
    ];
  }

  const totalRecords = await Whatsapp.countDocuments(query);
  const whatsappData = await Whatsapp.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });

  return { totalRecords, whatsappData, page, limit };
};

exports.updateWhatsappService = async (whatsappId, builderUserId, updateData) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const whatsapp = await Whatsapp.findOne({ _id: whatsappId, builderId: builder._id, isDeleted: false });
  if (!whatsapp) throw new Error("WhatsApp record not found");

  if (updateData.number) {
    updateData.number = "91" + updateData.number.replace(/\D/g, "");
  }

  const updatedWhatsapp = await Whatsapp.findByIdAndUpdate(whatsappId, updateData, { new: true });

  if (updateData.number && updateData.number !== whatsapp.number) {
    const notification = new Notification({
      title: "WhatsApp Number Updated",
      message: `Builder "${builder.companyName}" updated WhatsApp number to ${updateData.number}.`,
      type: "whatsapp_updated",
      builderId: builder._id,
      targetRole: "ADMIN"
    });
    await notification.save();

    const io = getIO();
    const populatedWhatsapp = await Whatsapp.findById(updatedWhatsapp._id).populate("builderId", "companyName");
    
    const admins = await User.find({ role: "ADMIN", isDeleted: false }, "_id");
    admins.forEach(admin => {
      io.to(admin._id.toString()).emit("admin_notification", {
        notification,
        whatsapp: populatedWhatsapp,
      });
    });

    io.emit("whatsapp_page_update", {
      action: "update",
      whatsapp: populatedWhatsapp,
    });
  }
  
  return updatedWhatsapp;
};

exports.deleteWhatsappService = async (whatsappId, builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const whatsapp = await Whatsapp.findOne({ _id: whatsappId, builderId: builder._id });
  if (!whatsapp) throw new Error("WhatsApp record not found");

  whatsapp.isDeleted = true;
  whatsapp.deleteRequested = true;
  await whatsapp.save();

  // Notify admin
  const notification = new Notification({
    title: "WhatsApp Deletion Requested",
    message: `Builder "${builder.companyName}" requested to delete WhatsApp number ${whatsapp.number}.`,
    type: "whatsapp_deleted",
    builderId: builder._id,
    targetRole: "ADMIN"
  });
  await notification.save();

  const io = getIO();
  const populatedWhatsapp = await Whatsapp.findById(whatsapp._id).populate("builderId", "companyName");
  
  const admins = await User.find({ role: "ADMIN", isDeleted: false }, "_id");
  admins.forEach(admin => {
    io.to(admin._id.toString()).emit("admin_notification", {
      notification,
      whatsapp: populatedWhatsapp,
    });
  });

  io.emit("whatsapp_page_update", {
    action: "update",
    whatsapp: populatedWhatsapp,
  });
};

exports.getAllWhatsappForAdminService = async () => {
  return await Whatsapp.find({ isDeleted: false })
    .populate("builderId", "companyName")
    .sort({ createdAt: -1 });
};

exports.updateWhatsappStatusService = async (whatsappId, statusData) => {
  const updatedWhatsapp = await Whatsapp.findByIdAndUpdate(
    whatsappId,
    { $set: statusData },
    { new: true }
  ).populate("builderId", "companyName");

  if (!updatedWhatsapp) throw new Error("WhatsApp record not found");

  const io = getIO();
  io.emit("whatsapp_status_update", {
    whatsappId: updatedWhatsapp._id,
    whatsappStatus: updatedWhatsapp.whatsappStatus,
    chatbotStatus: updatedWhatsapp.chatbotStatus,
  });

  return updatedWhatsapp;
};

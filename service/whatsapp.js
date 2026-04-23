const Whatsapp = require("../model/whatsapp");
const Builder = require("../model/builder");

exports.createWhatsappService = async (builderUserId, { name, number }) => {
  // 1. Find the builder
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  // Format number: Always prepend 91 to the 10-digit number from frontend
  let formattedNumber = "91" + number.replace(/\D/g, "");

  // 2. Check limits
  const currentCount = await Whatsapp.countDocuments({ builderId: builder._id, isDeleted: false });
  if (currentCount >= builder.currentLimits.noOfWhatsapp) {
    throw new Error(`WhatsApp limit reached for your current plan (${builder.currentLimits.noOfWhatsapp}). Please upgrade your plan to add more numbers.`);
  }

  // 3. Create Whatsapp entry
  const newWhatsapp = new Whatsapp({
    name,
    number: formattedNumber,
    builderId: builder._id,
  });
  await newWhatsapp.save();

  return newWhatsapp;
};

exports.fetchBuilderWhatsappService = async (builderUserId, { page = 1, limit = 10, search = "" }) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const skip = (page - 1) * limit;
  
  let query = { 
    builderId: builder._id, 
    isDeleted: false 
  };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { number: { $regex: search, $options: "i" } },
    ];
  }

  const totalRecords = await Whatsapp.countDocuments(query);
  const whatsappData = await Whatsapp.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

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
  
  return updatedWhatsapp;
};

exports.deleteWhatsappService = async (whatsappId, builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const whatsapp = await Whatsapp.findOne({ _id: whatsappId, builderId: builder._id });
  if (!whatsapp) throw new Error("WhatsApp record not found");

  whatsapp.isDeleted = true;
  await whatsapp.save();
};

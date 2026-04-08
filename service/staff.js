const User = require("../model/user");
const Staff = require("../model/staff");
const Builder = require("../model/builder");
const { encryptData } = require("../utils/crypto");

exports.createStaffService = async (builderUserId, staffData) => {
  const { fullName, email, phone, password, staffRole } = staffData;

  // 1. Find the builder
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  // 2. Check limits
  const currentStaffCount = await Staff.countDocuments({ builderId: builder._id, isDeleted: false });
  if (currentStaffCount >= builder.currentLimits.noOfStaff) {
    throw new Error(`Staff limit reached for your current plan (${builder.currentLimits.noOfStaff}). Please upgrade your plan to add more staff.`);
  }

  // 3. Check if user already exists in THIS builder's context
  const existingUserInCompany = await User.findOne({
    $or: [{ email }, { phone }],
    builderId: builder._id,
    isDeleted: false
  });
  if (existingUserInCompany) throw new Error("Staff with this email or phone already exists in your company");

  // 4. Create User (Scoping to THIS builder)
  const newUser = new User({
    fullName,
    email,
    phone,
    password: encryptData(password),
    role: "STAFF",
    builderId: builder._id, // Scoping for email/phone unique index
  });
  const savedUser = await newUser.save();

  // 5. Create Staff entry
  const newStaff = new Staff({
    userId: savedUser._id,
    builderId: builder._id,
    staffRole,
    password: encryptData(password),
  });
  await newStaff.save();

  return { user: savedUser, staff: newStaff };
};

exports.fetchBuilderStaffService = async (builderUserId, { page, limit, search }) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const skip = (page - 1) * limit;
  
  // Find all user IDs that match the search (if any) and are STAFF
  let userQuery = { role: "STAFF", isDeleted: false };
  if (search) {
    userQuery.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }
  
  const users = await User.find(userQuery).select("_id");
  const userIds = users.map(u => u._id);

  const staffQuery = { 
    builderId: builder._id, 
    userId: { $in: userIds },
    isDeleted: false 
  };

  const totalStaff = await Staff.countDocuments(staffQuery);
  const staffData = await Staff.find(staffQuery)
    .populate("userId", "fullName email phone status")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  return { totalStaff, staffData, page, limit };
};

exports.updateStaffService = async (staffId, builderUserId, updateData) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const staff = await Staff.findOne({ _id: staffId, builderId: builder._id, isDeleted: false });
  if (!staff) throw new Error("Staff not found");

  if (updateData.password) {
    const encryptedPassword = encryptData(updateData.password);
    updateData.password = encryptedPassword;
    await User.findByIdAndUpdate(staff.userId, { password: encryptedPassword });
  }

  // Update user info if provided
  if (updateData.fullName || updateData.email || updateData.phone || updateData.status) {
    const userUpdates = {};
    if (updateData.fullName) userUpdates.fullName = updateData.fullName;
    if (updateData.email) userUpdates.email = updateData.email;
    if (updateData.phone) userUpdates.phone = updateData.phone;
    if (updateData.status) userUpdates.status = updateData.status;

    await User.findByIdAndUpdate(staff.userId, userUpdates);
  }

  const updatedStaff = await Staff.findByIdAndUpdate(staffId, updateData, { new: true }).populate("userId");
  
  return updatedStaff;
};

exports.deleteStaffService = async (staffId, builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const staff = await Staff.findOne({ _id: staffId, builderId: builder._id });
  if (!staff) throw new Error("Staff not found");

  staff.isDeleted = true;
  await staff.save();

  await User.findByIdAndUpdate(staff.userId, { isDeleted: true });
};

exports.getStaffDropdownService = async (builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");

  const staffData = await Staff.find({ 
    builderId: builder._id, 
    isDeleted: false 
  }).populate("userId", "fullName status");

  // Only return active staff
  return staffData
    .filter(s => s.userId.status === 'active')
    .map(s => ({
      _id: s._id,
      fullName: s.userId.fullName,
      staffRole: s.staffRole
    }));
};

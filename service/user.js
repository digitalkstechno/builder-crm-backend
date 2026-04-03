const USER = require("../model/user");
const { encryptData, decryptData } = require("../utils/crypto");
const jwt = require("jsonwebtoken");

exports.createUserService = async ({ fullName, email, phone, password, role }) => {
  const encryptedPassword = encryptData(password);
  const userData = { fullName, email, phone, status: "active", password: encryptedPassword, role };
  const userDetails = await USER.create(userData);
  return userDetails;
};

exports.loginUserService = async ({ email, password }) => {
  const userVerify = await USER.findOne({ email });
  if (!userVerify) throw new Error("Invalid Email or password");

  const decryptedPassword = decryptData(userVerify.password);
  if (String(decryptedPassword) !== password) throw new Error("Invalid password");

  const token = jwt.sign({ id: userVerify._id }, process.env.JWT_SECRET_KEY);
  return { user: userVerify, token };
};

exports.fetchAllUsersService = async ({ page, limit, search }) => {
  const skip = (page - 1) * limit;
  const query = {
    $or: [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
      { role: { $regex: search, $options: "i" } },
    ],
  };
  const totalUser = await USER.countDocuments(query);
  const usersData = await USER.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
  return { totalUser, usersData, page, limit };
};

exports.fetchUserByIdService = async (userId) => {
  const userData = await USER.findById(userId);
  if (!userData) throw new Error("User not found");
  return userData;
};

exports.userUpdateService = async (userId, body) => {
  const oldUser = await USER.findById(userId);
  if (!oldUser) throw new Error("User not found");
  if (body.password) body.password = encryptData(body.password);
  const updatedUser = await USER.findByIdAndUpdate(userId, body, { new: true });
  return updatedUser;
};

exports.userDeleteService = async (userId) => {
  const oldUser = await USER.findById(userId);
  if (!oldUser) throw new Error("User not found");
  await USER.findByIdAndDelete(userId);
};

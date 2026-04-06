require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../model/user");
const { encryptData } = require("../utils/crypto");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const adminEmail = "admin@gmail.com";
    const adminPassword = "12345678";

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("Admin already exists. Updating password...");
      existingAdmin.password = encryptData(adminPassword);
      await existingAdmin.save();
      console.log("Admin password updated successfully.");
    } else {
      const newAdmin = new User({
        fullName: "Super Admin",
        email: adminEmail,
        phone: "0000000000",
        password: encryptData(adminPassword),
        role: "ADMIN",
      });
      await newAdmin.save();
      console.log("Admin created successfully.");
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();

const Notification = require("../model/notification");
const Builder = require("../model/builder");
const Staff = require("../model/staff");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    let query = {};

    // Check if user is Builder
    const builder = await Builder.findOne({ userId, isDeleted: false });
    if (builder) {
      query = { builderId: builder._id, recipientId: { $exists: false } };
    } else {
      // Check if user is Staff
      const staff = await Staff.findOne({ userId, isDeleted: false });
      if (staff) {
        query = { recipientId: userId };
      } else {
        return res.status(200).json({ status: "Success", data: [] });
      }
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    return res.status(200).json({
      status: "Success",
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) throw new Error("Notification not found");
    return res.status(200).json({
      status: "Success",
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    let query = { isRead: false };

    const builder = await Builder.findOne({ userId, isDeleted: false });
    if (builder) {
      query.builderId = builder._id;
      query.recipientId = { $exists: false };
    } else {
      const staff = await Staff.findOne({ userId, isDeleted: false });
      if (staff) {
        query.recipientId = userId;
      }
    }

    await Notification.updateMany(query, { isRead: true });
    return res.status(200).json({
      status: "Success",
      message: "All notifications marked as read",
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

const Notification = require("../model/notification");
const Builder = require("../model/builder");
const Staff = require("../model/staff");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    let query = {};

    if (role === 'ADMIN') {
      // Central Admin sees only system-targeted notifications
      query = { targetRole: 'ADMIN' };
    } else {
      // All other users (BUILDER, STAFF) see ONLY notifications sent specifically to them
      query = { recipientId: userId };
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
    const role = req.user.role;
    let query = { isRead: false };

    if (role === 'ADMIN') {
      query.targetRole = 'ADMIN';
    } else {
      query.recipientId = userId;
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

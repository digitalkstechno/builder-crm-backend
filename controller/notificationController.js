const Notification = require("../model/notification");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
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
    await Notification.updateMany({ isRead: false }, { isRead: true });
    return res.status(200).json({
      status: "Success",
      message: "All notifications marked as read",
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

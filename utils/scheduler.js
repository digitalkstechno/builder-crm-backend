const cron = require("node-cron");
const Reminder = require("../model/reminder");
const Lead = require("../model/lead");
const Notification = require("../model/notification");
const Staff = require("../model/staff");
const { getIO } = require("./socket");

const checkReminders = async () => {
  try {
    const now = new Date();
    
    // Find due reminders that haven't been sent
    const dueReminders = await Reminder.find({
      reminderDate: { $lte: now },
      isSent: false,
      isActive: true,
      isDeleted: false
    }).populate('leadId');

    if (dueReminders.length === 0) return;

    for (const reminder of dueReminders) {
      // Atomic lock
      const updateResult = await Reminder.updateOne(
        { _id: reminder._id, isSent: false },
        { $set: { isSent: true, sentAt: now } }
      );

      if (updateResult.modifiedCount === 0) continue;

      const lead = reminder.leadId;
      if (!lead) continue;

      let recipientUserId = null;
      if (lead.agentId) {
        // Find staff to get their userId
        const staff = await Staff.findById(lead.agentId);
        if (staff) {
          recipientUserId = staff.userId;
        }
      }

      if (recipientUserId) {
        // Create persistent notification
        const notification = new Notification({
          title: "Followup Reminder",
          message: reminder.message || `Scheduled followup for ${lead.name}`,
          type: "reminder",
          leadId: lead._id,
          builderId: reminder.builderId,
          recipientId: recipientUserId,
          targetRole: "STAFF"
        });
        await notification.save();

        // Real-time emit
        try {
          const io = getIO();
          const targetRoom = recipientUserId.toString();
          
          io.to(targetRoom).emit("reminder_alert", {
            notification,
            title: "Followup Alert",
            message: reminder.message || `Scheduled followup for ${lead.name}`,
            leadId: lead._id
          });
          
          console.log(`[Scheduler] Notification sent to user ${targetRoom} for lead ${lead.name}`);
        } catch (socketErr) {
          console.error("[Scheduler] Socket error:", socketErr.message);
        }
      }
    }
  } catch (error) {
    console.error("[Scheduler] Critical Error:", error.message);
  }
};

const initScheduler = () => {
  console.log("------------------------------------------");
  console.log("PRODUCTION CRON SCHEDULER INITIALIZED");
  console.log("------------------------------------------");
  
  cron.schedule("* * * * *", checkReminders);
  
  // Initial check
  checkReminders();
};

module.exports = { initScheduler };

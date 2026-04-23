const cron = require("node-cron");
const Reminder = require("../model/reminder");
const Lead = require("../model/lead");
const Notification = require("../model/notification");
const Staff = require("../model/staff");
const Builder = require("../model/builder");
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

const checkSubscriptions = async () => {
  try {
    const now = new Date();
    
    // Find builders with active subscriptions that have expired
    const buildersWithExpiredSub = await Builder.find({
      'subscriptions': {
        $elemMatch: {
          status: 'active',
          endDate: { $lt: now }
        }
      }
    });

    if (buildersWithExpiredSub.length === 0) return;

    for (const builder of buildersWithExpiredSub) {
      let activeSubIndex = builder.subscriptions.findIndex(s => s.status === 'active' && s.endDate < now);
      
      if (activeSubIndex !== -1) {
        console.log(`[Scheduler] Processing expiration for builder: ${builder.companyName}`);
        
        // Mark current active as expired
        builder.subscriptions[activeSubIndex].status = 'expired';

        // Check for upcoming subscription
        const upcomingSubIndex = builder.subscriptions.findIndex(s => s.status === 'upcoming');
        
        if (upcomingSubIndex !== -1) {
          console.log(`[Scheduler] Activating upcoming plan for builder: ${builder.companyName}`);
          
          // Mark upcoming as active
          builder.subscriptions[upcomingSubIndex].status = 'active';
          
          // Update limits from the new active plan
          builder.currentLimits = {
            noOfStaff: builder.subscriptions[upcomingSubIndex].noOfStaff,
            noOfSites: builder.subscriptions[upcomingSubIndex].noOfSites,
            noOfWhatsapp: builder.subscriptions[upcomingSubIndex].noOfWhatsapp,
          };
        } else {
           // No upcoming plan, reset limits
           console.log(`[Scheduler] No upcoming plan for builder: ${builder.companyName}. Resetting limits.`);
           builder.currentLimits = {
             noOfStaff: 0,
             noOfSites: 0,
             noOfWhatsapp: 0,
           };
        }

        await builder.save();
      }
    }
  } catch (error) {
    console.error("[Scheduler] Subscription Error:", error.message);
  }
};

const initScheduler = () => {
  console.log("------------------------------------------");
  console.log("PRODUCTION CRON SCHEDULER INITIALIZED");
  console.log("------------------------------------------");
  
  cron.schedule("* * * * *", checkReminders);
  
  // Check subscriptions every hour
  cron.schedule("0 * * * *", checkSubscriptions);
  
  // Initial check
  checkReminders();
  checkSubscriptions();
};

module.exports = { initScheduler };

const cron = require('node-cron');
const Builder = require('../model/builder');

const initSubscriptionCron = () => {
  // Run every hour to check for expired subscriptions
  cron.schedule('0 * * * *', async () => {
    console.log('CRON: Checking for expired subscriptions...');
    try {
      const now = new Date();
      
      // 1. Find builders with active subscriptions that have expired
      const buildersWithExpiredSub = await Builder.find({
        'subscriptions': {
          $elemMatch: {
            status: 'active',
            endDate: { $lt: now }
          }
        }
      });

      console.log(`CRON: Found ${buildersWithExpiredSub.length} builders with expired subscriptions.`);

      for (const builder of buildersWithExpiredSub) {
        let activeSubIndex = builder.subscriptions.findIndex(s => s.status === 'active' && s.endDate < now);
        
        if (activeSubIndex !== -1) {
          console.log(`CRON: Processing expiration for builder: ${builder.companyName}`);
          
          // Mark current active as expired
          builder.subscriptions[activeSubIndex].status = 'expired';

          // Check for upcoming subscription
          const upcomingSubIndex = builder.subscriptions.findIndex(s => s.status === 'upcoming');
          
          if (upcomingSubIndex !== -1) {
            console.log(`CRON: Activating upcoming plan for builder: ${builder.companyName}`);
            
            // Mark upcoming as active
            builder.subscriptions[upcomingSubIndex].status = 'active';
            
            // Update limits from the new active plan
            builder.currentLimits = {
              noOfStaff: builder.subscriptions[upcomingSubIndex].noOfStaff,
              noOfSites: builder.subscriptions[upcomingSubIndex].noOfSites,
              noOfWhatsapp: builder.subscriptions[upcomingSubIndex].noOfWhatsapp,
            };
          } else {
             // No upcoming plan, reset limits to zero (or basic)
             console.log(`CRON: No upcoming plan for builder: ${builder.companyName}. Resetting limits.`);
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
      console.error('CRON ERROR: Subscription update failed:', error);
    }
  });
};

module.exports = { initSubscriptionCron };

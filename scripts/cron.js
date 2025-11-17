import cron from 'cron';
import https from 'https';

// Trigger render platfrom after every 14 minutes
const job = new cron.CronJob('*/14 * * * *', () => {
    console.log('Cron job started: Pinging Render to keep the app awake.');
    https.get(process.env.RENDER_URL, (res) => {
        console.log(`Pinged Render with status code: ${res.statusCode}`);
    }).on('error', (e) => {
        console.error(`Error pinging Render: ${e.message}`);
    });
});

job.start();
console.log('Cron job scheduled to ping Render every 14 minutes.');


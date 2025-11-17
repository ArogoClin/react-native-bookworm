import cron from 'node-cron';
import https from 'https';

const RENDER_URL = process.env.RENDER_URL || 'https://react-native-bookworm-k71o.onrender.com';

// Trigger render platform after every 14 minutes
const job = cron.schedule('*/14 * * * *', () => {
    console.log('Cron job started: Pinging Render to keep the app awake.');
    https.get(RENDER_URL, (res) => {
        console.log(`Pinged Render with status code: ${res.statusCode}`);
    }).on('error', (e) => {
        console.error(`Error pinging Render: ${e.message}`);
    });
});

console.log('Cron job scheduled to ping Render every 14 minutes.');

export default job;
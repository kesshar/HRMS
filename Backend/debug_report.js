const mongoose = require('mongoose');
const Report = require('./models/Report');
const dotenv = require('dotenv');
dotenv.config();

async function checkLastReport() {
    await mongoose.connect(process.env.MONGO_URI);
    const lastReport = await Report.findOne().sort({ createdAt: -1 });
    console.log('Last Report:', JSON.stringify(lastReport, null, 2));
    process.exit(0);
}

checkLastReport();

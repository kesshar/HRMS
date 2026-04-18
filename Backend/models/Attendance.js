const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization1',
        required: true
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    checkIn: {
        time: Date,
        location: {
            latitude: Number,
            longitude: Number,
            address: String
        },
        deviceId: String,
        ip: String
    },
    checkOut: {
        time: Date,
        location: {
            latitude: Number,
            longitude: Number,
            address: String
        },
        deviceId: String,
        ip: String
    },
    breakTime: [{
        start: Date,
        end: Date,
        duration: Number
    }],
    totalHours: {
        type: Number,
        default: 0
    },
    overtimeHours: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'half_day', 'holiday', 'leave'],
        default: 'present'
    },
    notes: String,
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    isApproved: {
        type: Boolean,
        default: true
    },
    manualEntry: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

attendanceSchema.index({ organization: 1, employee: 1, date: -1 });
attendanceSchema.index({ organization: 1, date: -1 });
attendanceSchema.index({ employee: 1, date: -1 });

attendanceSchema.pre('save', async function() {
    if (this.checkIn && this.checkOut) {
        const checkInTime = new Date(this.checkIn.time);
        const checkOutTime = new Date(this.checkOut.time);
        const totalMs = checkOutTime - checkInTime;
        this.totalHours = Math.round((totalMs / (1000 * 60 * 60)) * 100) / 100;
        
        if (this.totalHours > 8) {
            this.overtimeHours = Math.round((this.totalHours - 8) * 100) / 100;
        }
    }
});

module.exports = mongoose.model('Attendance', attendanceSchema);

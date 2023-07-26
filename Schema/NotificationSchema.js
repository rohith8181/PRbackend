const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    content: { type: String },
    link: { type: String, default: '/home' },
    createdAt: { type: Date, default: Date.now },
})

const Notification = mongoose.model('Notifications', NotificationSchema);

module.exports = Notification

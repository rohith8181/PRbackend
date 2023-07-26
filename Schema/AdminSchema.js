const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String },
    Profilepic: { type: String, default: '/images/defaultprofile.png' },
});

const Admin = mongoose.model('Admin', AdminSchema);

module.exports = Admin;
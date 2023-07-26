const mongoose = require('mongoose');

const petitionsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    overview: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    SignedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expiretime: { type: Number, default: 3 },
    isexpired: { type: Boolean, default: false },
    relevanceScore: { type: Number, default: 0 },
})

const Petition = mongoose.model('Petitions', petitionsSchema);

module.exports = Petition
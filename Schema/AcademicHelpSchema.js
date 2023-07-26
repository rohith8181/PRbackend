const mongoose = require('mongoose');


const AcademicSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String },
    Overview: { type: String },
    content: { type: String, required: true },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'comment' }],
    relevanceScore: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
})

const Academic = mongoose.model('Academichelp', AcademicSchema);

module.exports = Academic;
const mongoose = require('mongoose');



const questionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    hashtags: [{ type: String }],
    answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
    relevanceScore: { type: Number, default: 0 },
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    Postid: { type: mongoose.Schema.Types.ObjectId, ref: 'Academichelp' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Comment = mongoose.model('comment', commentSchema);

module.exports = Comment;
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  relevanceScore: { type: Number, default: 0 }
});

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;
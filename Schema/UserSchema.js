const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String },
  reputation: { type: Number, default: 0 },
  Profilepic: { type: String, default: '/images/defaultprofile.png' },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  createdAt: { type: Date, default: Date.now },
  subscribedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  Questionsasked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  AnswersGiven: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
  PostsUploaded: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Academichelp' }],
  PetitionsAsked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Petitions' }],
  Commentsposted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
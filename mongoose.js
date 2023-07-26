const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  createdAt: { type: Date, default: Date.now },
  numQuestions: { type: Number, default: 0 },
  numAnswers: { type: Number, default: 0 },
  numPetitions: { type: Number, default: 0 },
  subscribedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  Questionsasked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  Answersasked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
  subscribersCount: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

// Question Schema
const questionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, required: true },
  name: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  hashtags: [{ type: String }],
  answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 }
});

const Question = mongoose.model('Question', questionSchema);

// QuestionOfTheDay Schema
const questionOfTheDaySchema = new mongoose.Schema({
  question: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  answers: [{
    answer: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
});

const QuestionOfTheDay = mongoose.model('QuestionOfTheDay', questionOfTheDaySchema);

// Answer Schema
const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, required: true },
  name: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 }
});

const Answer = mongoose.model('Answer', answerSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Petitions Schema

const petitionsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, required: true },
  name: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  Supportcount : {type : Number, default:0},
})

const Petition = mongoose.model('Petition',petitionsSchema);
const { Router } = require('express')
const router = Router();
const Question = require('../Schema/QuestionSchema')
const Answer = require('../Schema/AnswerSchema');

router.post('/request/question/upvote', async (req, res) => {
    const { QuesID, userId } = req.body;

    const question = await Question.findById(QuesID).populate('userId', 'name email Profilepic role')

    if (question.upvotes.includes(userId)) {
        question.upvotes.pull(userId);
        await question.save();
        return res.status(200).json({ success: true, question: question });
    }

    if (question.downvotes.includes(userId)) {
        question.downvotes.pull(userId);
    }

    question.upvotes.push(userId);
    await question.save();
    res.status(200).json({ success: true, question: question })
})
router.post('/request/answer/upvote', async (req, res) => {
    const { AnsID, userId } = req.body;

    const answer = await Answer.findById(AnsID).populate('userId', 'name email Profilepic role')
    // console.log("upvote question", answer);

    if (answer.upvotes.includes(userId)) {
        answer.upvotes.pull(userId);
        await answer.save();
        return res.status(200).json({ success: true, answer: answer });
    }

    if (answer.downvotes.includes(userId)) {
        answer.downvotes.pull(userId);
    }

    answer.upvotes.push(userId);
    await answer.save();
    res.status(200).json({ success: true, answer: answer })
})

router.post('/request/question/downvote', async (req, res) => {
    const { QuesID, userId } = req.body;

    const question = await Question.findById(QuesID).populate('userId', 'name email Profilepic role');

    if (question.downvotes.includes(userId)) {
        question.downvotes.pull(userId);
        await question.save();
        return res.status(200).json({ success: true, question: question });
    }

    if (question.upvotes.includes(userId)) {
        question.upvotes.pull(userId);
    }

    question.downvotes.push(userId);
    await question.save();

    res.status(200).json({ success: true, question: question })
})
router.post('/request/answer/downvote', async (req, res) => {
    const { AnsID, userId } = req.body;

    const answer = await Answer.findById(AnsID).populate('userId', 'name email Profilepic role');

    if (answer.downvotes.includes(userId)) {
        answer.downvotes.pull(userId);
        await answer.save();
        return res.status(200).json({ success: true, answer: answer });
    }

    if (answer.upvotes.includes(userId)) {
        answer.upvotes.pull(userId);
    }

    answer.downvotes.push(userId);
    await answer.save();

    res.status(200).json({ success: true, answer: answer })
})


module.exports = router;

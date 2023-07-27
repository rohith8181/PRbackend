const express = require('express');
const Answer = require('../Schema/AnswerSchema');
const Question = require('../Schema/QuestionSchema');
const Notification = require('../Schema/NotificationSchema');
const User = require('../Schema/UserSchema');
const router = express.Router();

router.get('/request/fullquestion', async (req, res) => {
    const { questionid } = req.query;
    try {
        const question = await Question.findById(questionid)
            .populate('userId', 'name email Profilepic')

        if (question) {
            return res.status(200).json({ Isexists: true, question: question });
        }

        res.status(404).json({ Isexists: false, question: [] });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ Isexists: false, message: "Internal Error" });
    }
})

router.get('/request/answers', async (req, res) => {
    const { questionid, sortType } = req.query;

    try {

        switch (sortType) {
            case "latest":
                const latestanswers = await Answer.find({ questionId: questionid })
                    .populate('userId', 'name email Profilepic')
                    .sort({ createdAt: -1 })
                return res.status(200).json({ answers: latestanswers })

            case "oldest":
                const oldanswers = await Answer.find({ questionId: questionid })
                    .populate('userId', 'name email Profilepic')
                    .sort({ createdAt: 1 })

                return res.status(200).json({ answers: oldanswers })

            case "PopularChoice":
                const mostanswers = await Answer.aggregate([
                    { $match: { questionId: questionid } },
                    {
                        $project: {
                            questionid: 1,
                            userId: 1,
                            content: 1,
                            createdAt: 1,
                            upvotes: 1,
                            downvotes: 1,
                            relevanceScore: 1,
                            upvotesCount: { $size: "$upvotes" }
                        }
                    },
                    { $sort: { upvotesCount: -1 } },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'user'
                        }
                    },
                    { $unwind: '$user' },
                    {
                        $project: {
                            userId: {
                                _id: '$user._id',
                                email: '$user.email',
                                name: '$user.name',
                                Profilepic: '$user.Profilepic'
                            },
                            content: 1,
                            isAnonymous: 1,
                            createdAt: 1,
                            hashtags: 1,
                            answers: 1,
                            upvotes: 1,
                            downvotes: 1,
                            upvotesCount: 1
                        }
                    }
                ])
                return res.status(200).json({ answers: mostanswers });
            case "relevance":
                const relevanceanswers = await Answer.find({ questionId: questionid })
                    .populate('userId', 'name email Profilepic')
                    .sort({ relevanceScore: -1 })
                return res.status(200).json({ answers: relevanceanswers });

            default:
                return [];
        }
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false, answers: [] });
    }
})

router.post('/request/answer', async (req, res) => {
    const { questionid, userid, answer } = req.body;

    try {
        const Ans = await Answer.create({
            questionId: questionid,
            userId: userid,
            content: answer,
        })

        const user = await User.findById(userid);
        user.AnswersGiven.push(Ans._id);
        await user.save();

        const Qus = await Question.findById(questionid);
        Qus.answers.push(questionid);
        await Qus.save();
        const subscribers = await User.find({ _id: { $in: user.subscribers } });

        await Notification.create({
            userId: user.id,
            subId: subscribers,
            content: "A new Answer has been added by " + user.name,
        })
        res.send({
            status: 200,
            answer: Ans,
            message: "success",
        })
    }
    catch (err) {
        console.log(err);

        res.send({
            status: 404,
            message: 'error',
        })
    }
})


module.exports = router;
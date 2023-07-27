const express = require("express");
const router = express.Router();
const Question = require('../Schema/QuestionSchema');
const Notification = require('../Schema/NotificationSchema');
const User = require("../Schema/UserSchema");

const QUESTIONS_PER_PAGE = process.env.QUESTIONS_PER_PAGE;


router.get('/request/question', async (req, res) => {
    const { page, sorttype, hashtag } = req.query;
    const startIndex = (page - 1) * QUESTIONS_PER_PAGE;
    try {
        let query = { isVerified: true };
        if (hashtag) {
            query = { hashtags: hashtag, isVerified: true };
        }
        switch (sorttype) {
            case "latest":
                const latestpaginatedQuestions = await Question.find(query)
                    .sort({ createdAt: -1 })
                    .skip(startIndex)
                    .limit(QUESTIONS_PER_PAGE)
                    .populate('userId', 'email name Profilepic role')
                    .lean();

                let lquestioncount = 0;

                lquestioncount = await Question.countDocuments(query);
                return res.json({ Questions: latestpaginatedQuestions, questioncount: lquestioncount });

            case "oldest":
                const oldestpaginatedQuestions = await Question.find(query)
                    .sort({ createdAt: 1 })
                    .skip(startIndex)
                    .limit(QUESTIONS_PER_PAGE)
                    .populate('userId', 'email name Profilepic role')
                    .lean();

                let oquestioncount = 0;

                oquestioncount = await Question.countDocuments(query);

                return res.json({ Questions: oldestpaginatedQuestions, questioncount: oquestioncount });

            case "PopularChoice":
                const mostVotesPaginatedQuestions = await Question.aggregate([
                    {
                        $match: hashtag ? { hashtags: hashtag, isVerified: true } : { isVerified: true },
                    },
                    {
                        $project: {
                            userId: 1,
                            content: 1,
                            isAnonymous: 1,
                            createdAt: 1,
                            hashtags: 1,
                            answers: 1,
                            upvotes: 1,
                            downvotes: 1,
                            upvotesCount: { $size: "$upvotes" }
                        }
                    },
                    { $sort: { upvotesCount: -1 } },
                    { $skip: startIndex },
                    { $limit: 10 },
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
                                Profilepic: '$user.Profilepic',
                                role: '$user.role'
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
                ]);
                let mquestioncount = 0;
                mquestioncount = await Question.countDocuments(query);

                return res.json({ Questions: mostVotesPaginatedQuestions, questioncount: mquestioncount });

            case "relevance":
                const relavancepaginatedQuestions = await Question.find(query)
                    .sort({ relevanceScore: -1 })
                    .skip(startIndex)
                    .limit(QUESTIONS_PER_PAGE)
                    .populate('userId', 'email name Profilepic role')
                    .lean();

                let Rquestioncount = 0;

                Rquestioncount = await Question.countDocuments(query);

                return res.json({ Questions: relavancepaginatedQuestions, questioncount: Rquestioncount });
            default:
                return [];
        }

    } catch (error) {
        console.error('Failed to fetch questions', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
})

router.get('/request/reportquestion', async (req, res) => {
    const { questionId, userId } = req.query;

    try {
        const Ques = await Question.findById(questionId);

        if (Ques.reports.includes(userId)) {
            Ques.reports.pull(userId);
            await Ques.save();
            return res.status(200).json({ success: true, code: 2, message: "Question unreported" })
        }

        Ques.reports.push(userId);
        await Ques.save();

        res.status(200).json({
            success: true,
            code: 1,
            message: "Question reported success"
        })
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Internal Error" })
    }
})

router.post('/request/question', async (req, res) => {

    const { userId, question, hashtags, isAnonymous } = req.body;
    let isVerified = true;
    if (isAnonymous) {
        isVerified = false;
    }
    try {
        const Ques = await Question.create({
            userId: userId,
            content: question,
            hashtags: hashtags,
            isAnonymous: isAnonymous,
            isVerified: isVerified,
        })

        const user = await User.findById(userId);
        user.Questionsasked.push(Ques._id);
        await user.save();

        const subscribers = await User.find({ _id: { $in: user.subscribers } });

        if (!Ques.isAnonymous) {
            await Notification.create({
                userId: user.id,
                subId: subscribers,
                link: `/question/${Ques.id}`,
                content: "A new Question has been added by " + user.name,
            })
        }
        res.send({
            status: 200,
            message: "created success"
        })
    }
    catch (err) {
        console.log(err);
        res.send({
            status: 404,
            message: "create failed"
        })
    }
})

router.get('/request/hashtags/popular', async (req, res) => {
    try {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 10); // Set date limit to 10 days ago

        const popularHashtags = await Question.aggregate([
            { $match: { createdAt: { $gte: dateLimit } } }, // Filter by last 10 days
            { $unwind: '$hashtags' }, // Unwind the array field 'hashtags'
            { $group: { _id: '$hashtags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 } // Adjust the limit as per your requirements
        ]);
        // console.log("hastags", popularHashtags);
        return res.json({ success: true, popularHashtags });
    } catch (error) {
        console.error(error);
        return res.json({ success: false, error: 'Failed to fetch popular hashtags.' });
    }
})

router.get('/request/questions/search', async (req, res) => {
    const hashtag = req.query.hashtag;
    try {
        const questions = await Question.find({ hashtags: hashtag }).populate('userId', 'name email Profilepic role reputation');
        return res.json({ success: true, questions });
    } catch (error) {
        console.error(error);
        return res.json({ success: false, error: 'Failed to search questions.' });
    }
});

module.exports = router
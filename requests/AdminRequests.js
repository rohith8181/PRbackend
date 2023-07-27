const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const Question = require('../Schema/QuestionSchema');
const Admin = require('../Schema/AdminSchema')
const Comment = require('../Schema/CommentSchema')
const Academic = require('../Schema/AcademicHelpSchema')
const Answer = require('../Schema/AnswerSchema')
const Petition = require('../Schema/PetitionSchema');
const User = require('../Schema/UserSchema');
const Notification = require("../Schema/NotificationSchema");
const adtkngen = require('../Config/Tokengenerator');


router.post('/request/adminLogin', async (req, res) => {
    const { name, password } = req.body
    try {
        const admin = await Admin.findOne({ name: name })
        const tkn = adtkngen(name)
        if (!admin) {
            return res.json({ success: false })
        }
        const adminpassword = admin.password
        const passwordresult = await bcrypt.compare(password, adminpassword)

        if (passwordresult) {
            res.status(200).json({ success: true, message: "Login success", admintoken: tkn });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false })
    }
})

router.get('/request/Anonyquestions', async (req, res) => {
    try {
        const questions = await Question.find({ isVerified: false }).populate('userId', 'name email Profilepic role')
        // console.log(questions);
        res.status(200).json({ success: true, questions: questions });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false, questions: [] });
    }
})

router.get('/request/dashboarddetails', async (req, res) => {
    try {

        const questionCount = await Question.count();
        const academicCount = await Academic.count();
        const answerCount = await Answer.count();
        const petitionCount = await Petition.count();
        const userCount = await User.count();
        const reportcount = await Question.count({
            reports: { $exists: true, $ne: [] }
        });

        const dashboard = {
            questionCount: questionCount,
            academicCount: academicCount,
            answerCount: answerCount,
            petitionCount: petitionCount,
            userCount: userCount,
            reportcount: reportcount,
        }

        res.status(200).json({ success: true, dashboard: dashboard })
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, dashboard: [] })
    }
})

router.get('/request/getadmins', async (req, res) => {
    try {
        const admins = await Admin.find()
        res.status(200).json({ success: true, admins: admins })

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, admins: [] })
    }
})

router.get('/request/qapprove', async (req, res) => {
    const { questionId } = req.query;

    try {
        const Ques = await Question.findById(questionId)
        Ques.isVerified = true
        await Ques.save();

        res.status(200).json({ success: true, message: "Question Approved Success✅" })
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Internal Error" })
    }
})

router.delete('/request/qdelete', async (req, res) => {
    const { questionId } = req.query;

    try {
        await Question.findByIdAndDelete(questionId);

        res.status(200).json({ success: true, message: "Question Deleted" })

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Internal Error" })
    }
})

router.post('/request/addadmin', async (req, res) => {
    const { adname, adpassword } = req.body;

    try {

        const exists = await Admin.find({ name: adname })
        console.log(exists);
        if (exists.length > 0) {
            return res.status(200).json({ success: false, message: "Name Already exists" })
        }

        const saltRounds = 5;

        const hashedpassword = await bcrypt.hash(adpassword, saltRounds)

        await Admin.create({
            name: adname,
            password: hashedpassword,
            role: "Admin",
        })

        res.status(200).json({ success: true, message: "New Admin Created" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Request Failed" })
    }
})

router.delete('/request/admindelete', async (req, res) => {
    const { name } = req.query

    try {
        await Admin.deleteOne({ name: name })
        res.status(200).json({ success: true, message: "Admin Deleted" })

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false })
    }
})
router.delete('/request/userdelete', async (req, res) => {
    const { userid } = req.query
    try {

        await Question.deleteMany({ userId: userid })
        await Answer.deleteMany({ userId: userid })
        await Petition.deleteMany({ userId: userid })
        await Academic.deleteMany({ userId: userid })
        await Comment.deleteMany({ userId: userid })
        await Notification.deleteMany({ userId: userid })

        res.status(200).json({ success: true })
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false })
    }
})

router.get('/request/reportedquestions', async (req, res) => {
    try {
        const repques = await Question.aggregate([
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    content: 1,
                    isAnonymous: 1,
                    isVerified: 1,
                    createdAt: 1,
                    hashtags: 1,
                    answers: 1,
                    upvotes: 1,
                    downvotes: 1,
                    reports: 1,
                    relevanceScore: 1,
                    reportsCount: { $size: '$reports' }, // Add this field to get the size of the reports array
                },
            },
            {
                $match: {
                    reportsCount: { $gte: 5 }, // Now we can use the reportsCount field to filter based on >= 5 reports
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userDetails',
                },
            },
            {
                $unwind: '$userDetails',
            },
            {
                $project: {
                    _id: 1,
                    userId: '$userDetails._id',
                    name: '$userDetails.name',
                    email: '$userDetails.email',
                    Profilepic: '$userDetails.Profilepic',
                    role: '$userDetails.role',
                    content: 1,
                    isAnonymous: 1,
                    isVerified: 1,
                    createdAt: 1,
                    hashtags: 1,
                    answers: 1,
                    upvotes: 1,
                    downvotes: 1,
                    reports: 1,
                    relevanceScore: 1,
                },
            },
        ]);

        res.status(200).json({ success: true, reportedquestions: repques })

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, reportedquestions: [] })
    }
})


module.exports = router
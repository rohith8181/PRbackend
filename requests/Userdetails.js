const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../Schema/UserSchema');
const Question = require('../Schema/QuestionSchema');
const Petition = require('../Schema/PetitionSchema');
const Academic = require('../Schema/AcademicHelpSchema');
const Answer = require('../Schema/AnswerSchema');
const router = express.Router();


router.get('/request/userdetails', async (req, res) => {
    const token = req.headers["x-access-token"];
    if (!token) {
        res.send({
            status: 404,
            Userdetails: null,
        })
    }
    try {
        const { data } = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.find({ email: data });
        if (user) {
            res.send({
                status: 200,
                Userdetails: user,
            })
        }
        else {
            res.send({
                status: 404,
                Userdetails: null,
            })
        }
    }
    catch (err) {
        console.log(err);
    }


})

router.get('/request/selectedusersearch', async (req, res) => {
    const { userid } = req.query;

    try {

        const selecteduser = await User.findById(userid);
        // console.log("user", selecteduser);
        if (selecteduser) {
            return res.status(200).json({ success: true, user: selecteduser });
        }
        res.status(404).json({ success: false, user: [] });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, user: [] });
    }
})


router.get('/request/fetchuserrecords', async (req, res) => {
    const { userid } = req.query;
    try {

        const user = await User.findById(userid)
            .populate({
                path: 'Questionsasked',
                select: 'content createdAt isAnonymous',
                options: { sort: { createdAt: -1 } },
            })
            .populate({
                path: 'AnswersGiven',
                select: 'content createdAt',
                options: { sort: { createdAt: -1 } },
            })
            .populate({
                path: 'PostsUploaded',
                select: 'title createdAt',
                options: { sort: { createdAt: -1 } },
            })
            .populate({
                path: 'PetitionsAsked',
                select: 'title createdAt',
                options: { sort: { createdAt: -1 } },
            });

        // console.log("user", user);
        if (user) {
            return res.status(200).json({ success: true, records: user });
        }
        res.status(404).json({ success: false, records: [] });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
})

router.get('/request/usersearch', async (req, res) => {
    const { useremail } = req.query;

    try {

        const users = await User.find({ email: { $regex: useremail, $options: 'i' } });
        // console.log(users);
        if (users) {
            return res.status(200).json({ success: true, users: users });
        }
        res.status(200).json({ success: false, users: [] });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, users: [] });
    }
})

router.delete('/request/:type/:id', async (req, res) => {
    const { type, id } = req.params;

    try {

        switch (type) {
            case "question":
                const ques = await Question.findByIdAndDelete(id);
                if (!ques) {
                    return res.status(200).json({ success: false });
                }
                await User.updateMany({}, { $pull: { Questionsasked: ques.id } });
                await Answer.deleteMany({ questionId: ques.id });
                return res.status(200).json({ success: true });
            case "answer":
                const ans = await Answer.findByIdAndDelete(id);
                if (!ans) {
                    return res.status(200).json({ success: false });
                }
                await Question.updateMany({}, { $pull: { answers: ans.id } });
                await User.updateMany({}, { $pull: { AnswersGiven: ans.id } });
                return res.status(200).json({ success: true });
            case "Petition":
                const pet = await Petition.findByIdAndDelete(id);
                if (!pet) {
                    return res.status(200).json({ success: false });
                }
                await User.updateMany({}, { $pull: { PetitionsAsked: pet.id } });
                return res.status(200).json({ success: true });
            case "Post":
                const pos = await Academic.findByIdAndDelete(id);
                if (!pos) {
                    return res.status(200).json({ success: false });
                }
                await User.updateMany({}, { $pull: { PostsUploaded: pos.id } });
                return res.status(200).json({ success: true });

            default:
                return;
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Internal Error" });
    }
})


module.exports = router


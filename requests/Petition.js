const express = require('express');
const router = express.Router();
const Petition = require("../Schema/PetitionSchema");
const Notification = require("../Schema/NotificationSchema");
const User = require('../Schema/UserSchema');

router.post('/request/petitions', async (req, res) => {
    const { userId, title, overview, content, expiretime } = req.body;

    try {
        const Pet = await Petition.create({
            userId: userId,
            title: title,
            overview: overview,
            content: content,
            expiretime: expiretime,
        })

        const user = await User.findById(userId);
        user.PetitionsAsked.push(Pet._id);
        await user.save();

        const subscribers = await User.find({ _id: { $in: user.subscribers } });

        await Notification.create({
            userId: user.id,
            subId: subscribers,
            link: `/petition/${Pet.id}`,
            content: "A new Petition has been added by " + user.name,
        })
        res.send({
            status: 200,
            petition: Pet,
            message: "Petition posted Success",
        })

    } catch (err) {
        console.log(err);
        res.send({
            status: 404,
            message: "cannot Post error",
        })
    }
})
router.post('/request/petitionsign', async (req, res) => {
    const { userId, petid } = req.body;

    try {
        const pet = await Petition.findById(petid).populate('userId', 'name email Profilepic');
        if (pet.SignedBy.includes(userId)) {
            pet.SignedBy.pull(userId);
        } else {
            pet.SignedBy.push(userId);
        }
        await pet.save();
        if (pet) {
            return res.status(200).json({ success: true, petition: pet })
        }
        res.status(404).json({ success: false, petition: [] })

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Internal error" })
    }
})

router.get('/request/petition', async (req, res) => {
    const Petitionid = req.query.Petitionid;
    try {

        const Pet = await Petition.findById(Petitionid).populate('userId', 'name email Profilepic')
        console.log(Pet);
        if (Pet) {
            if (!Pet.isexpired) {
                const expirationDate = new Date(Pet.createdAt);
                expirationDate.setHours(expirationDate.getHours() + Pet.expiretime);

                if (Date.now() >= expirationDate) {
                    Pet.isexpired = true;
                    await Pet.save();
                }
            }
            return res.status(200).json({ Isexists: true, petition: Pet });
        }
        res.json({ Isexists: false, petition: [] });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "error", status: 404 })
    }
})

router.get('/request/petitions', async (req, res) => {
    try {

        const petitions = await Petition.find({ isexpired: false })
            .populate('userId', 'email name Profilepic role')

        // console.log(petitions);
        res.send({
            status: 200,
            petitions: petitions,
        })

    } catch (err) {
        console.log(err);
        res.send({
            status: 400,
            petitions: [],
        })
    }
})


module.exports = router;
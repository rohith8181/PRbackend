const express = require('express');

const router = express.Router();
const Notification = require('../Schema/NotificationSchema');
const User = require('../Schema/UserSchema');

router.get('/request/checksubed', async (req, res) => {
    console.log("checking");
    const { userID, subID } = req.query;
    // const { userId, subId } = req.body;
    // console.log("userid-->", userID);
    // console.log("subid -->", subID);
    try {
        const subbed = await User.findOne({ _id: userID, subscribedTo: subID })
        console.log("subbed-->", subbed);
        if (subbed) {
            console.log("if");
            return res.status(200).json({ success: true, message: "subed" });
        }
        console.log("notif")
        res.status(200).json({ success: false, message: "Not subbed" })
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Error" });
    }
})

router.post('/request/subscribed', async (req, res) => {
    const { userId, subId } = req.body;
    // console.log(userId,subId);
    try {
        const subbed = await User.findOne({ _id: userId, subscribedTo: subId })
        if (subbed) {
            console.log('unsubbing');
            await User.updateOne(
                { _id: userId },
                { $pull: { subscribedTo: subId } }
            );
            await User.updateOne(
                { _id: subId },
                { $pull: { subscribers: userId } }
            )
            console.log("part-2 unsub");
            return res.status(200).json({ success: true, type: "unsub" });
        }
        console.log("subbing");
        await User.updateOne(
            { _id: userId, subscribedTo: { $ne: subId } },
            { $addToSet: { subscribedTo: subId } }
        );
        await User.updateOne(
            { _id: subId },
            { $addToSet: { subscribers: userId } }
        )
        console.log("part-2 sub");
        res.status(200).json({ success: true, type: "sub" });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: true, message: "Error" });
    }
})

router.get('/request/notifications/:userId', async (req, res) => {
    const userId = req.params.userId;
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    try {
        const nfications = await Notification.find({ subId: userId, createdAt: { $gte: tenDaysAgo } }).populate('userId', 'email Profilepic')
            .sort({ createdAt: -1 })
        // console.log(nfications);
        res.status(200).json({ success: true, notifications: nfications })
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, notifications: [] });
    }

})



module.exports = router;
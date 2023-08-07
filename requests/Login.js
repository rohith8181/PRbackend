const express = require("express");
const Tokengenerator = require("../Config/Tokengenerator");
const User = require('../Schema/UserSchema');
const bcrypt = require('bcrypt');
const crypto = require('crypto')

const generatetoken = require('../Config/Tokengenerator');
const { sendMail } = require('../Config/SendMail');
const { sendforgotmail } = require('../Config/SendMail');


const router = express.Router();

router.post('/request/forgotpassword', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "Email doesn't exist" });
        }

        const length = 10;
        const randomBytes = crypto.randomBytes(length);
        const randomString = randomBytes.toString('hex');
        const saltRounds = 5;

        const hashedpassword = await bcrypt.hash(randomString, saltRounds)

        user.password = hashedpassword;
        await user.save();
        sendforgotmail(email, randomString)

        res.status(200).json({ success: true, message: "A new password has been sent to your email" })
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Error Please try again!" })
    }
})

router.post('/request/Updatepass', async (req, res) => {
    const { oldpass, newpass, userid } = req.body;

    try {

        const user = await User.findById(userid);
        const userPassword = user.password;
        const passwordresult = await bcrypt.compare(oldpass, userPassword)
        if (!passwordresult) {
            return res.status(200).json({ success: false, message: "Current Password Incorrect" })
        }
        const saltRounds = 5;

        const hashedpassword = await bcrypt.hash(newpass, saltRounds)

        user.password = hashedpassword;
        await user.save();
        res.status(200).json({ success: true, message: "Password Updated success" })

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Error Try again" });
    }
})

router.post('/request/login', async (req, res) => {
    const { email, password } = req.body;
    const tkn = Tokengenerator(email);
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ status: 204, message: "Email doesn't exist" });
        }
        const isverified = user.isVerified;
        const userPassword = user.password;
        const passwordresult = await bcrypt.compare(password, userPassword)
        if (passwordresult) {
            if (isverified) {
                return res.status(200).json({ status: 200, message: "Login success", token: tkn });
            }
            else {
                const token = generatetoken(email);
                user.verificationToken = token;
                await user.save();
                const link = `${process.env.CLIENT_LINK}/verify/${token}`;
                sendMail(email, link);

                return res.json({ status: 201, message: "Email not Veified" });
            }
        }

        return res.json({ status: 304, message: "Password Incorrect" });

    } catch (err) {
        console.log(err);
        res.send({
            status: 500,
            message: "Internal error"
        })
    }
})



module.exports = router




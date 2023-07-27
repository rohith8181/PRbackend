const express = require("express");
const Tokengenerator = require("../Config/Tokengenerator");
const User = require('../Schema/UserSchema');
const bcrypt = require('bcrypt');

const generatetoken = require('../Config/Tokengenerator');
const sendMail = require('../Config/SendMail');


const router = express.Router();


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
                const link = `${CLIENT_LINK}/verify/${token}`;
                sendMail(email, link);

                return res.json({ status: 201, message: "Email not Veified" });
            }
        }

        return res.json({ status: 304, message: "Password Incorrect" });

    } catch (err) {
        console.log("found error");
        res.send({
            status: 500,
            message: "Internal error"
        })
    }
})



module.exports = router




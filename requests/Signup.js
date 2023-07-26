const express = require('express');
const router = express.Router();

const User = require('../Schema/UserSchema');
const bcrypt = require('bcrypt');


const generatetoken = require('../Config/Tokengenerator');
const sendMail = require('../Config/SendMail');

router.get('/verify/:token', async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({ verificationToken: token });


  if (!user) {
    return res.send({
      status: 404,
      message: "Invalid verification token",
    });
  }
  user.isVerified = true;
  await user.save();
  await User.findByIdAndUpdate(
    user.id,
    { $unset: { verificationToken: 1 } },
    { new: true }
  );

  return res.send({
    status: 200,
    message: "Email verified successfully",
  });

})

router.post('/request/signup', async (req, res) => {
  try {

    const { name, email, password, role } = req.body;
    const saltRounds = 5;

    const hashedpassword = await bcrypt.hash(password, saltRounds)
    const user = await User.findOne({ email });
    if (user) {
      return res.send({
        status: 301,
        message: "User already exists",
      });
    }
    const token = generatetoken(email);
    const userdetails = await User.create({
      name: name,
      email: email,
      verificationToken: token,
      password: hashedpassword,
      role: role,
    });

    const link = `https://64c133dd85496f104015610b--euphonious-melomakarona-254aa9.netlify.app/verify/${token}`;

    sendMail(email, link);
    res.send({
      status: 304,
      message: "verification email has sent to your mail",
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal error" })
  }

})

module.exports = router;
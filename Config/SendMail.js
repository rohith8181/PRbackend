const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  service: 'gmail',
  port: 587,
  secure: true,
  auth: {
    user: 'rohithperala18@gmail.com',
    pass: 'jpvklwwzacjwsmft'
  }
});
const sendMail = async (receiveraddress, link) => {
  const info = await transporter.sendMail({
    from: '18@gmail.com', // sender address
    to: receiveraddress, // list of receivers
    subject: "PLEASE VERIFY YOUR EMAIL", // Subject line
    html: `<div class="bg-gray-100">
    <div class="container mx-auto mt-8 px-4">
      <div class="bg-white p-8 rounded shadow-md">
        <h1 class="text-2xl font-bold mb-4">Hello,</h1>
        <p class="mb-4">You registered an account on <span class="font-bold">StudentSupport</span>, before being able to use your account, you need to verify that this is your email address by clicking the button below:</p>
        <a href="${link}" class="block w-full text-center bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600">Verify Email Address</a>
        <p class="mt-4">Kind Regards, <span class="font-semibold">StudentSupport</span></p>
      </div>
    </div>
  </div>`
  });
};


module.exports = sendMail;
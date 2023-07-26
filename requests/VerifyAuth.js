const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

router.get('/request/verifyauth', async (req, res) => {

     const token = req.headers["x-access-token"];
     if (!token) {
          res.send({
               auth: false,
               message: "Needed Token to verify"
          })
     }
     else {
          try {
               jwt.verify(token, process.env.JWT_SECRET, (err) => {
                    if (err) {
                         res.send({
                              auth: false,
                              message: "Failed to Authenticate",
                         })
                    }
                    else {
                         res.send({
                              auth: true,
                              message: "authentication Success",
                         })
                    }
               })
          } catch (err) {
               console.log(err);
          }
     }

})

module.exports = router;
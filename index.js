const express = require('express');
const app = express();
const cors = require("cors");
app.use(cors());

require('dotenv').config();
const path = require('path');


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
require("./Config/dbconnect");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// app.use('/verify', verifyRouter);
app.use(require('./requests/Answer'))
app.use(require('./requests/Userdetails'))
app.use(require('./requests/Signup'))
app.use(require('./requests/Login'))
app.use(require('./requests/VerifyAuth'))
app.use(require('./requests/Question'))
app.use(require('./requests/Petition'))
app.use(require('./requests/Academichelp'))
app.use(require('./requests/Votes'))
app.use(require('./requests/reputation'))
app.use(require('./requests/Notifications'))
app.use(require('./requests/AdminRequests'))

app.listen(5000, () => {
    console.log('server running at 5000')
});

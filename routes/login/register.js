var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer');
var mongodb = require("mongodb");
var bcrypt = require('bcrypt');
const { connectDb, db } = require('../../config');

// Creating and Verifyng User
router.post("/create", async (req, res, next) => {

    try {
        const db = await connectDb();
        var salt = await bcrypt.genSalt(10);
        var hash = await bcrypt.hash(req.body.password, salt);
        req.body.password = hash;
        const user = await db.collection("url").insertOne({ status: "inActive", ...req.body });
        if (user) {
            const token = jwt.sign({ _id: user.insertedId, username: req.body.username }, process.env.JWT_SECRET, { expiresIn: "10m" })
            const link = `https://url-shortner-react-dusky.vercel.app/verify/${token}`;

            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'dhanushvarmanj66@gmail.com',
                    pass: 'cmskelsyfieblemd'
                }
            });

            var mailOptions = {
                from: 'dhanushvarmanj66@gmail.com',
                to: req.body.username,
                subject: 'Password Reset Link',
                html: `<div><h4>Click the link to Verify the Account</div><div><h2>VERIFY LINK : </h2>${link}</div>`
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });

            res.json({ message: "Email Sent Successfuly" })
        } else {
            console.log(error)
            res.status(500).json({ message: "Something Went Wrong in Creating Account" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Something Went Wrong in Creating User" })
    }
})

// Verifying User
router.put("/verify/:token", async (req, res, next) => {

    try {
        const verify = jwt.verify(req.params.token, process.env.JWT_SECRET);
        const decode = jwt.decode(req.params.token);
        const id = (decode._id).trim();
        const db = await connectDb();
        const user = await db.collection("url").findOne({ _id: mongodb.ObjectId(id) });
        if (user) {
            await db.collection("url").updateOne({ _id: user._id }, { $set: { status: "Active" } });

            res.json({ message: "Account Verified" });
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Something Went Wrong in Verifying User" })
    }
})

//Login page
router.post("/login", async (req, res, next) => {

    try {
        const db = await connectDb();
        const user = await db.collection("url").findOne({ username: req.body.username });
        if (user) {
            if (user.status == "inActive") {
                res.status(401).json({message : "Account Not verified"})
            } else {
                const compare = await bcrypt.compare(req.body.password, user.password);
                if (compare) {
                    const token = jwt.sign({ _id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "12h" });
                    res.json(user)
                } else {
                    res.status(401).json({ message: "Username/Password is Incorrect" })
                }
            }
        }else{
            res.status(404).json({ message: "Username/Password is Incorrect" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Something Went Wrong in Login" })
    }
})

// Forgot-password
router.post("/forgot-password", async (req, res, next) => {

    try {
        const db = await connectDb();
        const user = await db.collection("url").findOne({ username: req.body.username })
        if (user) {
            const token = jwt.sign({ _id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "10m" });
            const link = `https://url-shortner-react-dusky.vercel.app/verification/${user._id}/${token}`;
            let randomString = (Math.random() + 1).toString(36).substring(7);
            await db.collection("url").updateOne({ _id: user._id }, { $set: { random: randomString } });

            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'dhanushvarmanj66@gmail.com',
                    pass: 'cmskelsyfieblemd'
                }
            });

            var mailOptions = {
                from: 'dhanushvarmanj66@gmail.com',
                to: user.username,
                subject: 'Password Reset Link',
                html: `<div><h4>VERFICATION CODE :</h4> ${randomString}</div><div><h2>RESET PASSWORD : </h2>${link}</div>`
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });

            res.json({ message: "Email Sent Successfuly" })
        } else {
            res.status(404).json({ message: "User not found" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Something Went Wrong in Forgot Password" })
    }
})

//For account verification code is got from databse for verification
router.get("/:id", async (req, res, next) => {

    try {
        const db = await connectDb();
        const Id = (req.params.id).trim();
        const user = await db.collection("url").findOne({ _id: mongodb.ObjectId(Id) });
        if (user) {
            res.json(user)
        } else {
            res.status(404).json({ message: "User not found" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Something Went Wrong in Getting user" })
    }
})

// Reset password
router.post("/reset-password/:id/:token", async (req, res, next) => {

    try {
        const { id, token } = req.params;
        const { password } = req.body.password;
        const db = await connectDb();
        const user = await db.collection("url").findOne({ _id: mongodb.ObjectId(id) })
        if (user) {
            const verify = jwt.verify(token, process.env.JWT_SECRET);
            var salt = await bcrypt.genSalt(10);
            var hash = await bcrypt.hash(req.body.password, salt);
            req.body.password = hash;
            await db.collection("url").updateOne({ _id: mongodb.ObjectId(id) }, { $set: { password: hash } });
            res.json({ message: "Password Updated" })
        } else {
            res.status(401).json({ message: "Username not found" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Something Went Wrong in Reset Password" })
    }
})

module.exports = router;

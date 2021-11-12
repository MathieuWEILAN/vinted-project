const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const cloudinary = require("cloudinary").v2;
const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    const password = req.fields.password;
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(16);

    // let pictureToUpload = req.files.picture.path;
    // const pictureUploaded = await cloudinary.uploader.upload(pictureToUpload);

    const checkEmailUser = await User.findOne({ email: req.fields.email });
    if (checkEmailUser) {
      res.status(400).json({ error: "email is already used" });
    } else {
      if (req.fields.username === undefined) {
        res.status(400).json({ error: "username required" });
      } else {
        const newUser = new User({
          email: req.fields.email,
          account: {
            username: req.fields.username,
            phone: req.fields.phone,
            // picture: pictureUploaded,
          },
          token: token,
          hash: hash,
          salt: salt,
        });
        await newUser.save();
        res.json({
          _id: newUser._id,
          email: newUser.email,
          token: newUser.token,
          account: newUser.account,
          // picture: newUser.picture.secure_url,
        });
      }
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const checkUser = await User.findOne({ email: req.fields.email });

    if (checkUser) {
      const hash = SHA256(req.fields.password + checkUser.salt).toString(
        encBase64
      );
      // console.log(hash);
      if (hash === checkUser.hash) {
        res.json({
          id: checkUser.id,
          token: checkUser.token,
          account: checkUser.account,
        });
      } else {
        res.status(400).json("Wrong password");
      }
    } else {
      res.status(400).json("email not valid");
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

require("dotenv").config();
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const { stringify } = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;

const cors = require("cors");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAM,
  api_key: process.env.CLOUDINNARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(formidable({ multiples: true }));
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);

const userRoutes = require("./routes/user");
app.use(userRoutes);

const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.json({ message: "All route" });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server has started");
});

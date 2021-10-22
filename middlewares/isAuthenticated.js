// const express = require("express");
// const mongoose = require("mongoose");
// mongoose.connect("mongodb://localhost/vinted");
// pas nécessaire
const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  if (req.headers.authorization) {
    const user = await User.findOne({
      token: req.headers.authorization.replace("Bearer ", ""),
    });
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    } else {
      console.log("is authenticated");
      req.user = user;
      return next();
    }
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = isAuthenticated;

const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Offer = require("../models/Offer");
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middlewares/isAuthenticated");

cloudinary.config({
  cloud_name: "dma82gjsr",
  api_key: "953489413644315",
  api_secret: "rf7XAQs66HxDMrHJ7FBzki1-lM0",
});

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    {
      const newOffer = new Offer({
        product_name: req.fields.title,
        product_description: req.fields.description,
        product_price: req.fields.price,
        product_details: [
          { condition: req.fields.condition },
          { brand: req.fields.brand },
          { size: req.fields.size },
          { color: req.fields.color },
          { city: req.fields.city },
        ],
        owner: req.user,
      });
      //   console.log(pictureUploaded);
      let pictureToUpload = req.files.picture.path;
      const pictureUploaded = await cloudinary.uploader.upload(
        pictureToUpload,
        { folder: `/vinted/offers/${newOffer.id}` }
      );
      newOffer.product_image = pictureUploaded.secure_url;
      await newOffer.save();
      res.json(newOffer);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/offer/update", isAuthenticated, async (req, res) => {
  try {
    const offerToModifie = await Offer.findById(req.fields.id);
    if (!offerToModifie) {
      res.status(400).json({ error: "false ID" });
    } else {
      if (req.fields.product_title) {
        offerToModifie.product_name = req.fields.product_title;
      }
      if (req.fields.product_price) {
        offerToModifie.product_price = req.fields.product_price;
      }
      if (req.fields.product_description) {
        offerToModifie.product_description = req.fields.product_description;
      }
      if (req.fields.product_condition) {
        offerToModifie.product_details[0] = {
          condition: req.fields.product_condition,
        };
      }
      if (req.fields.product_brand) {
        offerToModifie.product_details[1] = { brand: req.fields.product_brand };
      }
      if (req.fields.product_size) {
        offerToModifie.product_details[2] = { size: req.fields.product_size };
      }
      if (req.fields.product_color) {
        offerToModifie.product_details[3] = { color: req.fields.product_color };
      }
      if (req.fields.product_city) {
        offerToModifie.product_details[4] = { city: req.fields.product_city };
      }
      await offerToModifie.save();
      //   console.log(req.fields.product_title);
      console.log(offerToModifie);
      res.json("Modified");
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/offer/delete", isAuthenticated, async (req, res) => {
  try {
    if (req.fields.id) {
      await Offer.findByIdAndDelete(req.fields.id);
      res.json({ messsage: "Offer removed" });
    } else {
      res.status(400).json({ message: "Missing id" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    let filter = {};
    if (req.query.title) {
      filter.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin && !req.query.priceMax) {
      filter.product_price = { $gte: req.query.priceMin };
    } else if (req.query.priceMax && !req.query.priceMin) {
      filter.product_price = { $lte: req.query.priceMax };
    } else if (req.query.priceMax && req.query.priceMin) {
      filter.product_price = {
        $gte: req.query.priceMin,
        $lte: req.query.priceMax,
      };
    }

    let sort = {};
    if (req.query.sort === "price-desc") {
      sort.product_price = -1;
    } else if (req.query.sort === "price-asc") {
      sort.product_price = 1;
    }
    const limit = 100;
    let page = 1;

    const count = await Offer.countDocuments(filter);

    if (req.query.page) {
      // vraie formule : page = limit * (req.query.page -1)
      page = limit * req.query.page;
      const checkProducts = await Offer.find(filter)
        // .select("product_name product_price ")
        .sort(sort)
        .skip(page)
        .limit(limit);
      res.json({ count: count, offers: checkProducts });
    } else {
      page = 1;
      const checkProducts = await Offer.find(filter)
        // .select("product_name product_price")
        .sort(sort)
        .skip(page)
        .limit(limit);
      res.json({ count: count, offers: checkProducts });
    }
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    // console.log(req.params);
    const checkId = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });

    res.json(checkId);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
module.exports = router;

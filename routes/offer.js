const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_API_SECRET_KEY);

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
      // console.log(pictureUploaded);
      // let pictureToUpload = req.files.picture.path;
      // const pictureUploaded = await cloudinary.uploader.upload(
      //   pictureToUpload,
      //   { folder: `/vinted/offers/${newOffer.id}` }
      // );
      // newOffer.product_image = pictureUploaded.secure_url;
      // console.log(req.fields.pictures);

      // upload several pictures

      console.log("req.files", req.files.picture);
      const newArrPic = [];
      for (let i = 0; i < req.files.picture.length; i++) {
        const result = await cloudinary.uploader.upload(
          req.files.picture[i].path,
          {
            folder: `/vinted/offers/${newOffer.id}`,
          }
        );
        newArrPic.push(result);
      }
      newOffer.product_pictures = newArrPic;
      newOffer.product_image = newOffer.product_pictures[0].secure_url;
      await newOffer.save();
      res.json(newOffer);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.log(error);
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

    let limit = 8;

    let page = req.query.page;

    const count = await Offer.countDocuments(filter);

    if (req.query.page) {
      const checkProducts = await Offer.find(filter)
        // .select("product_name product_price ")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);

      res.json({
        count: count,
        offers: checkProducts,
      });
    } else {
      const checkProducts = await Offer.find(filter)
        // .select("product_name product_price")
        .sort(sort);
      res.json({
        count: count,
        offers: checkProducts,
      });
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
    const checkBuyer = await User.findOne({
      token: req.headers.authorization.replace("Bearer ", ""),
    });

    res.json({ checkId, checkBuyer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/pay", async (req, res) => {
  const stripeToken = req.fields.stripeToken;
  const response = await stripe.charges.create({
    amount: req.fields.total * 100,
    currency: "eur",
    description: req.fields.title,
    source: stripeToken,
    // idBuyer: req.fields.idBuyer,
  });
  if (response.status === "succeeded") {
    res.status(200).json({ message: "Paiement valid??" });
  } else {
    res.status(400).json({ message: "An error occured" });
  }

  const newPurchase = { title: req.fields.title, price: req.fields.total };
  const userToModifie = await User.findById(req.fields.idBuyer);
  if (!userToModifie) {
    res.status(400).json({ error: "false ID" });
  } else {
    userToModifie.purchase.push(newPurchase);
  }
  await userToModifie.save();
  console.log(userToModifie);
});

module.exports = router;

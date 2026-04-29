const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

let images = {}; // simple memory storage

// Generate AI image
app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.replicate.com/v1/predictions",
      {
        version: "YOUR_MODEL_VERSION",
        input: {
          prompt: "ultra realistic attractive glow-up portrait, cinematic lighting, high detail",
        }
      },
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_KEY}`
        }
      }
    );

    const id = Date.now().toString();

    images[id] = {
      image: response.data.output?.[0] || "https://via.placeholder.com/300",
      unlocked: false
    };

    res.json({
      id,
      image: images[id].image
    });

  } catch (err) {
    console.log(err.message);
    res.status(500).send("Error generating image");
  }
});

// Stripe checkout
app.post("/create-checkout", async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "PrimeLook HD Glow-Up"
          },
          unit_amount: 999
        },
        quantity: 1
      }
    ],
    success_url: "https://your-site.com/success",
    cancel_url: "https://your-site.com"
  });

  res.json({ url: session.url });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

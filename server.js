;console.log("THIS SERVER FILE IS RUNNING");
require("dotenv").config();
const Deal = require("./models/Deal");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Trip = require("./models/Trip");
const User = require("./models/User");
const Visit = require("./models/Visit");

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
console.log("MONGO_URI:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas Connected ✅"))
  .catch(err => console.log("mangodb connection error",err));

// HOME route
app.get("/", (req, res) => {
  res.send("Server Working 🚀");
});

// TEST route
app.get("/test", (req, res) => {
  res.send("Test route working");
});

// REGISTER route
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const newUser = new User({ name, email, password });
    await newUser.save();
    res.json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "User not found" });
    if (user.password !== password) return res.json({ message: "Invalid password" });

    const today = new Date().toISOString().split("T")[0];
    let record = await Visit.findOne({ date: today });
    if (record) {
      record.logins += 1;
      await record.save();
    } else {
      await Visit.create({ date: today, visits: 0, logins: 1 });
    }
    res.json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TRIP ROUTES
app.post("/save-trip", async (req, res) => {
  try {
    const { email, destination, date } = req.body;
    const newTrip = new Trip({ email, destination, date });
    await newTrip.save();
    res.json({ message: "Trip saved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/my-trips/:email", async (req, res) => {
  try {
    const trips = await Trip.find({ email: req.params.email });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/delete-trip/:id", async (req, res) => {
  try {
    await Trip.findByIdAndDelete(req.params.id);
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ UPDATED DEALS ROUTE (Combines Mongo + Real-time Travelpayouts)
app.get("/deals", async (req, res) => {
  try {
    // 1. Fetch random static deals from MongoDB
    const staticDeals = await Deal.aggregate([{ $sample: { size: 10 } }]);

    // 2. Fetch live flight data (optional, but good for real-time)
    let liveDeals = [];
    try {
      const response = await fetch(
        "https://api.travelpayouts.com/v2/prices/latest?origin=BLR&currency=inr&limit=5",
        { headers: { "X-Access-Token": process.env.TRAVELPAYOUTS_API_KEY } }
      );
      const data = await response.json();
      if (data.success) {
        liveDeals = data.data.map(item => ({
          title: `${item.destination} Flight Deal`,
          price: `₹${item.price}`,
          discount: "Live Rate 🔥",
          link: `https://www.wego.co.in/flights/blr/${item.destination}?marker=${process.env.TRAVELPAYOUTS_MARKER}`
        }));
      }
    } catch (apiErr) { console.log("API skipping..."); }

    // 3. 🔥 THE FIX: Correct your MongoDB links on the fly
    const fixedStaticDeals = staticDeals.map(deal => {
      // Extract the city name (e.g., "Goa" from "Goa Beach Tour Package")
      const cityName = deal.title.split(' ')[0]; 
      
      return {
        ...deal,
        // Replace the old Yatra/MMT link with a Klook search link
        link: `https://www.klook.com/en-IN/search/result/?query=${cityName}&aid=${process.env.TRAVELPAYOUTS_MARKER}`
      };
    });

    // 4. Send the combined, fixed data
    res.json([...fixedStaticDeals, ...liveDeals]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// VISIT TRACKER
app.post("/visit", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    let record = await Visit.findOne({ date: today });
    if (record) {
      record.visits += 1;
      await record.save();
    } else {
      await Visit.create({ date: today, visits: 1, logins: 0 });
    }
    res.json({ message: "Visit counted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ATTRACTIONS (Geoapify)
app.get("/api/attractions", async (req, res) => {
  const place = req.query.place;
  try {
    const geoRes = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(place)}&apiKey=${process.env.API_KEY}`);
    const geoData = await geoRes.json();
    if (!geoData.features.length) return res.json({ features: [] });
    const { lon, lat } = geoData.features[0].properties;
    const placesRes = await fetch(`https://api.geoapify.com/v2/places?categories=tourism.sights,heritage,entertainment.zoo,leisure.park,religion.place_of_worship&filter=circle:${lon},${lat},15000&limit=20&apiKey=${process.env.API_KEY}`);
    const data = await placesRes.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch attractions" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

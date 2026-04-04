console.log("THIS SERVER FILE IS RUNNING");
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
  console.log("Register API hit");
  console.log(req.body);

  try {
    const { name, email, password } = req.body;

    const newUser = new User({ name, email, password });

    await newUser.save();

    console.log("Saved to DB ✅");

    res.json({ message: "User registered successfully" });

  } catch (error) {
    console.log("ERROR:", error); // 👈 THIS IS IMPORTANT
    res.status(500).json({ error: error.message });
  }
});

// START SERVER
app.listen(5000, () => {
  console.log("Server running on port 5000");
});

// login

 app.post("/login", async (req, res) => {
  console.log("Login API hit");

  try {
    const { email, password } = req.body;

    // check user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: "User not found" });
    }

    // check password
    if (user.password !== password) {
      return res.json({ message: "Invalid password" });
    }

    // 🔥 ADD THIS LOGIN COUNT CODE
    const today = new Date().toISOString().split("T")[0];

    let record = await Visit.findOne({ date: today });

    if (record) {
      record.logins += 1;
      await record.save();
    } else {
      await Visit.create({ date: today, visits: 0, logins: 1 });
    }

    console.log("LOGIN COUNT UPDATED"); // ✅ debug

    res.json({ message: "Login successful", user });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});


//Trip

app.post("/save-trip", async (req, res) => {
  console.log("Save Trip API hit");

  try {
    const { email, destination, date } = req.body;

    const newTrip = new Trip({ email, destination, date });
    await newTrip.save();

    res.json({ message: "Trip saved successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});


app.get("/my-trips/:email", async (req, res) => {
  try {
    const trips = await Trip.find({ email: req.params.email });
    console.log("Trips found:", trips);
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
console.log("Delete route loaded");

app.delete("/delete-trip/:id", async (req, res) => {
  console.log("DELETE API HIT:", req.params.id);

  try {
    await Trip.findByIdAndDelete(req.params.id);
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET DEALS (RANDOM)
app.get("/deals", async (req, res) => {
  try {
    const deals = await Deal.aggregate([
      { $sample: { size: 10 } } // 🔥 random deals
    ]);

    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.post("/visit", async (req, res) => {
  console.log("VISIT API HIT"); // 👈 ADD THIS

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
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});









 
app.get("/api/attractions", async (req, res) => {
  const place = req.query.place;

  try {
    // GET LOCATION
    const geoRes = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(place)}&apiKey=${process.env.API_KEY}`
    );
    const geoData = await geoRes.json();

    if (!geoData.features.length) {
      return res.json({ features: [] });
    }

    const { lon, lat } = geoData.features[0].properties;

    // GET PLACES
    const placesRes = await fetch(
      `https://api.geoapify.com/v2/places?categories=tourism.sights,heritage,entertainment.zoo,leisure.park,religion.place_of_worship&filter=circle:${lon},${lat},15000&limit=20&apiKey=${process.env.API_KEY}`
    );

    const data = await placesRes.json();

    res.json(data);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch attractions" });
  }
});
require("dotenv").config(); // .env laden
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express(); // Muss vor app.use() stehen!
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: true,          // oder exakte URL, z. B. "https://rischis-kiosk-t2uv.onrender.com"
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Static Routes
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});
app.get("/mentos", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "mentos.html"));
});
app.get("/shop", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "shop.html"));
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API-Routen
app.use("/api", require("./routes/feed"));
app.use("/api/products", require("./routes/products"));
app.use("/api", require("./routes/buy"));
app.use("/api/user", require("./routes/user"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/purchases", require("./routes/purchases")); // ✅ HIER NEU
app.use("/api/admin/products", require("./routes/admin/products"));
app.use("/api/admin/purchases", require("./routes/admin/purchases"));
app.use("/api/admin/stats", require("./routes/admin/stats"));
app.use('/api/activity', require('./routes/activity'));


// Server starten
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});

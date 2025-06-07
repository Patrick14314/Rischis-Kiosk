require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Static routes for HTML entry points
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

// API routes
app.use("/api", require("./routes/feed"));
app.use("/api", require("./routes/products"));
app.use("/api", require("./routes/buy"));
app.use("/api", require("./routes/user"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/admin/products", require("./routes/admin/products"));
app.use("/api/admin/purchases", require("./routes/admin/purchases"));
app.use("/api/admin/stats", require("./routes/admin/stats"));

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
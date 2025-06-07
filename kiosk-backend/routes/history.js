const express = require("express");
const router = express.Router();
const supabase = require("../utils/supabase"); // ggf. Pfad anpassen
const getUserFromRequest = require("../utils/getUser"); // Session-Check

// GET /api/history?sort=desc|asc|price_asc|price_desc
router.get("/history", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Nicht eingeloggt" });

  const sort = req.query.sort || "desc";

  let orderColumn = "created_at";
  let ascending = false;

  switch (sort) {
    case "asc":
      ascending = true;
      break;
    case "price_asc":
      orderColumn = "price";
      ascending = true;
      break;
    case "price_desc":
      orderColumn = "price";
      ascending = false;
      break;
    case "desc":
    default:
      ascending = false;
  }

  const { data, error } = await supabase
    .from("purchases")
    .select("created_at, product_name, quantity, price")
    .eq("user_id", user.id)
    .order(orderColumn, { ascending });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;

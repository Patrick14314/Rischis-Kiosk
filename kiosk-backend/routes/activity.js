const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const getUserFromRequest = require('../utils/getUser');

router.post('/', async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Nicht eingeloggt" });

  const { error } = await supabase.from("activity_log").insert({
    user_id: user.id,
    action: "shop_opened"
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;

// kiosk-backend/utils/getUser.js
function getUser(req) {
  const userId = req.headers['x-user-id']; // oder ein JWT auswerten etc.
  return { id: userId };
}

module.exports = getUser;

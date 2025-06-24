const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  res.json({ message: 'login not implemented' });
});

module.exports = router;

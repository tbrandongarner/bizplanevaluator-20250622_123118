const express = require('express');
const router = express.Router();

router.post('/subscribe', (req, res) => {
  res.json({ message: 'billing route' });
});

module.exports = router;

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'report route' });
});

module.exports = router;

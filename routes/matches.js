const express = require('express');
const router = express.Router();
const { getAllMatches, getTeamMatches, getTeamSquad } = require('../services/matchesService');

router.get('/matches', async (req, res) => {
  const data = await getAllMatches();
  if (data.error) return res.status(500).json({ message: data.error });
  res.status(200).json(data);
});

module.exports = router;

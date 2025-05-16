const express = require('express');
const router = express.Router();
const { getAllMatches, getTeamMatches, getTeamSquad } = require('../services/matchesService');

router.get('/matches', async (req, res) => {
  const data = await getAllMatches();
  if (data.error) return res.status(500).json({ message: data.error });
  res.status(200).json(data);
});

// Nova pot: Tekme izbrane ekipe
router.get('/team/:teamId/matches', async (req, res) => {
  const { teamId } = req.params;
  const data = await getTeamMatches(teamId);
  if (data.error) return res.status(500).json({ message: data.error });
  res.status(200).json(data);
});

// Nova pot: Igralci (squad) izbrane ekipe
router.get('/team/:teamId/squad', async (req, res) => {
  const { teamId } = req.params;
  const data = await getTeamSquad(teamId);
  if (data.error) return res.status(500).json({ message: data.error });
  res.status(200).json(data);
});

module.exports = router;

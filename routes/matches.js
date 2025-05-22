const express = require('express');
const router = express.Router();
const {
  getAllMatches,
  getTeamMatches,
  getTeamSquad,
  getPlayerDetails,
  getPlayerMatches,
} = require('../services/matchesService');
const axios = require('axios');

router.get('/matches', async (req, res) => {
  const date = req.query.date; // npr. 2024-05-20
  try {
    console.log(`➡️ Klic GET /matches z datumom: ${date}`); // <-- popravljen log
    const data = await getAllMatches(date); // zdaj to deluje!
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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

// New route: Get player details
router.get('/player/:playerId', async (req, res) => {
  const { playerId } = req.params;
  const data = await getPlayerDetails(playerId);
  if (data.error) return res.status(500).json({ message: data.error });
  res.status(200).json(data);
});

// New route: Get player matches
router.get('/player/:playerId/matches', async (req, res) => {
  const { playerId } = req.params;
  const { limit } = req.query;
  const data = await getPlayerMatches(playerId, limit);
  if (data.error) return res.status(500).json({ message: data.error });
  res.status(200).json(data);
});

module.exports = router;

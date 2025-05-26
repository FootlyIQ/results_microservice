const express = require('express');
const router = express.Router();
const {
  getAllMatches,
  getTeamMatches,
  getTeamSquad,
  getPlayerDetails,
  getPlayerMatches,
  getTeamCompetitionsAndSeasons,
} = require('../services/matchesService');

router.get('/matches', async (req, res) => {
  const date = req.query.date;
  try {
    console.log(`➡️ Klic GET /matches z datumom: ${date}`); // <-- popravljen log
    const data = await getAllMatches(date); // zdaj to deluje!
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update team matches route to handle filters
router.get('/team/:teamId/matches', async (req, res) => {
  const { teamId } = req.params;
  const { season, competition } = req.query;
  const data = await getTeamMatches(teamId, season, competition);
  if (data.error) return res.status(500).json({ message: data.error });
  res.status(200).json(data);
});

router.get('/team/:teamId/filters', async (req, res) => {
  try {
    const { teamId } = req.params;
    console.log(`Fetching filters for team ${teamId}`);
    const data = await getTeamCompetitionsAndSeasons(teamId);
    if (data.error) {
      return res.status(500).json({ message: data.error });
    }
    res.json(data);
  } catch (error) {
    console.error('Error in filters route:', error);
    res.status(500).json({ message: error.message });
  }
});

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
  const { limit, season, competition } = req.query;
  const data = await getPlayerMatches(playerId, limit, season, competition);
  if (data.error) return res.status(500).json({ message: data.error });
  res.status(200).json(data);
});

module.exports = router;

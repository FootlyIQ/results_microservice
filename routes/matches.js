const express = require('express');
const router = express.Router();
const {
  getAllMatches,
  getTeamMatches,
  getTeamSquad,
  getPlayerDetails,
  getPlayerMatches,
  getTeamCompetitionsAndSeasons,
  getCompetitionDetails,
  searchTeams,
  searchPlayers,
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

// Get competition details
router.get('/competition/:competitionCode', async (req, res) => {
  try {
    const { competitionCode } = req.params;
    const { season } = req.query;
    console.log(`Fetching details for competition: ${competitionCode}, season: ${season}`);
    const data = await getCompetitionDetails(competitionCode, season);
    if (data.error) {
      console.error('Error from getCompetitionDetails:', data.error);
      return res.status(500).json(data);
    }
    res.json(data);
  } catch (error) {
    console.error('Error in competition route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search teams by name
router.get('/search/teams', async (req, res) => {
  try {
    const { q } = req.query;
    console.log(`🔍 Teams search route called for: "${q}"`);

    const result = await searchTeams(q);

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error in team search route:', error);
    res.status(500).json({ error: 'Failed to search teams' });
  }
});

// Search players by name
router.get('/search/players', async (req, res) => {
  try {
    const { q, team_id } = req.query;
    console.log(`🔍 Players search route called for: "${q}" (team_id: ${team_id})`);

    const result = await searchPlayers(q, team_id);

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error in player search route:', error);
    res.status(500).json({ error: 'Failed to search players' });
  }
});

module.exports = router;

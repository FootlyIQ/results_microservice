const express = require('express');
const router = express.Router();
const { getMatchStatistics } = require('../services/matchStatisticsService');

router.get('/:matchId/statistics', async (req, res) => {
  const { matchId } = req.params;
  const data = await getMatchStatistics(matchId);

  if (data.error) return res.status(500).json({ message: data.error });

  res.status(200).json(data);
});

module.exports = router;

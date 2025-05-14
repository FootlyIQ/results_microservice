const axios = require('axios');
const moment = require('moment-timezone');

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;
const headers = { 'X-Auth-Token': API_KEY };
const timezone = 'Europe/Madrid';

exports.getAllMatches = async () => {
  try {
    const response = await axios.get(API_URL, { headers });

    const leagues = {};

    response.data.matches.forEach((match) => {
      const league = match.competition?.name || 'Unknown League';
      const homeTeam = match.homeTeam?.name || 'Unknown';
      const awayTeam = match.awayTeam?.name || 'Unknown';
      const homeCrest = match.homeTeam?.crest || '';
      const awayCrest = match.awayTeam?.crest || '';
      const status =
        match.status === 'LIVE'
          ? 'LIVE'
          : match.score.fullTime?.home != null
          ? 'Finished'
          : 'Scheduled';
      const score =
        status === 'Finished'
          ? `${match.score.fullTime.home} - ${match.score.fullTime.away}`
          : status === 'LIVE'
          ? 'LIVE'
          : 'Match not played yet';
      const date = moment(match.utcDate).tz(timezone).format('DD.MM.YYYY ob HH:mm');

      const matchData = {
        home_team: homeTeam,
        away_team: awayTeam,
        home_crest: homeCrest,
        away_crest: awayCrest,
        score,
        status,
        date,
      };

      if (!leagues[league]) leagues[league] = [];
      leagues[league].push(matchData);
    });

    return Object.keys(leagues).map((league) => ({
      league,
      matches: leagues[league],
    }));
  } catch (err) {
    console.error(err.message);
    return { error: 'Failed to fetch matches' };
  }
};

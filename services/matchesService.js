const axios = require('axios');
const moment = require('moment-timezone');

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;
const TEAM_MATCHES_URL = process.env.TEAM_MATCHES_URL;
const TEAM_SQUAD_URL = process.env.TEAM_SQUAD_URL;
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

      // Log ID za debug (v terminalu)
      console.log(`Match ID: ${match.id} | ${homeTeam} vs ${awayTeam}`);

      const matchData = {
        match_id: match.id,
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

exports.getTeamMatches = async (teamId) => {
  try {
    const response = await axios.get(`${TEAM_MATCHES_URL}/${teamId}/matches`, { headers });

    const matches = response.data.matches.map((match) => {
      const homeTeam = match.homeTeam?.name || 'Unknown';
      const awayTeam = match.awayTeam?.name || 'Unknown';
      const score =
        match.score.fullTime?.home != null
          ? `${match.score.fullTime.home} - ${match.score.fullTime.away}`
          : 'Match not played yet';
      const date = moment(match.utcDate).tz(timezone).format('DD.MM.YYYY ob HH:mm');

      return {
        home_team: homeTeam,
        away_team: awayTeam,
        score,
        date,
      };
    });

    return matches;
  } catch (err) {
    console.error(err.message);
    return { error: 'Failed to fetch team matches' };
  }
};

exports.getTeamSquad = async (teamId) => {
  try {
    const response = await axios.get(`${TEAM_SQUAD_URL}/${teamId}`, { headers });

    const data = response.data;
    const coach = data.coach || {};
    const squad = [];

    squad.push({
      name: coach.name || 'Unknown',
      position: 'Manager',
      dateOfBirth: coach.dateOfBirth || 'Unknown',
      nationality: coach.nationality || 'Unknown',
    });

    data.squad.forEach((player) => {
      squad.push({
        name: player.name || 'Unknown',
        position: player.position || 'Unknown',
        dateOfBirth: player.dateOfBirth || 'Unknown',
        nationality: player.nationality || 'Unknown',
      });
    });

    return {
      team: data.name || 'Unknown',
      squad,
    };
  } catch (err) {
    console.error(err.message);
    return { error: 'Failed to fetch team squad' };
  }
};

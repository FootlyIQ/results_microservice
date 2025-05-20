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

    const countries = {};

    response.data.matches.forEach((match) => {
      //console.log(`ID: ${match.id}, status API: ${match.status}`);
      //console.log('GEGEEEE', match);
      const country = match.area?.name || 'Unknown Country';
      const countryFlag = match.area?.flag || '';
      const league = match.competition?.name || 'Unknown League';
      const leagueEmblem = match.competition?.emblem || '';
      const homeTeam = match.homeTeam?.name || 'Unknown';
      const awayTeam = match.awayTeam?.name || 'Unknown';
      const homeCrest = match.homeTeam?.crest || '';
      const awayCrest = match.awayTeam?.crest || '';

      const status =
        match.status === 'PAUSED'
          ? 'Half Time'
          : ['LIVE', 'IN_PLAY'].includes(match.status)
          ? 'LIVE'
          : match.score.fullTime?.home != null && match.status === 'FINISHED'
          ? 'Finished'
          : 'Scheduled';

      const date = moment(match.utcDate).tz(timezone).format('DD.MM.YYYY ob HH:mm');

      let score = 'Match not played yet';

      if (status === 'Finished') {
        score = `${match.score.fullTime.home} - ${match.score.fullTime.away}`;
      } else if (status === 'Half Time') {
        if (match.score.halfTime?.home != null) {
          score = `${match.score.halfTime.home} - ${match.score.halfTime.away}`;
        } else {
          score = 'Half Time';
        }
      } else if (status === 'LIVE') {
        if (match.score.fullTime?.home != null) {
          score = `${match.score.fullTime.home} - ${match.score.fullTime.away}`;
        } else {
          score = '';
        }
      } else if (status === 'Scheduled') {
        score = date;
      }

      const matchData = {
        match_id: match.id,
        home_team: homeTeam,
        away_team: awayTeam,
        home_crest: homeCrest,
        away_crest: awayCrest,
        score,
        status,
        date,
        venue: match.venue || '',
        matchday: match.matchday || '',
      };

      // Če država še ne obstaja, jo dodaj
      if (!countries[country]) {
        countries[country] = {
          flag: countryFlag,
          leagues: {},
        };
      }

      // Če liga še ne obstaja v državi, jo dodaj
      if (!countries[country].leagues[league]) {
        countries[country].leagues[league] = {
          emblem: leagueEmblem,
          matches: [],
        };
      }

      // Dodaj tekmo v pravilno ligo pod državo
      countries[country].leagues[league].matches.push(matchData);
    });

    // Pretvori v lepši array format za frontend
    const result = Object.entries(countries).map(([country, data]) => ({
      country,
      flag: data.flag,
      leagues: Object.entries(data.leagues).map(([league, leagueData]) => ({
        league,
        emblem: leagueData.emblem,
        matches: leagueData.matches,
      })),
    }));

    return result;
  } catch (err) {
    console.error(err.message);
    return { error: 'Failed to fetch matches' };
  }
};

exports.getTeamMatches = async (teamId) => {
  try {
    const response = await axios.get(`${TEAM_MATCHES_URL}/${teamId}/matches`, { headers });

    const matches = response.data.matches.map((match) => {
      // console.log('Match:', match);
      const homeTeam = match.homeTeam?.name || 'Unknown';
      const awayTeam = match.awayTeam?.name || 'Unknown';
      const homeCrest = match.homeTeam?.crest || '';
      const awayCrest = match.awayTeam?.crest || '';
      const matchId = match.id;

      const score =
        match.score.fullTime?.home != null
          ? `${match.score.fullTime.home} - ${match.score.fullTime.away}`
          : 'Match not played yet';

      const date = moment(match.utcDate).tz(timezone).format('DD.MM.YYYY ob HH:mm');

      // NOVO:
      const competitionName = match.competition?.name || 'Neznana liga';
      const competitionLogo = match.competition?.emblem || '';
      const matchday = match.matchday || '';
      const stage = match.stage || '';

      return {
        match_id: matchId,
        home_team: homeTeam,
        away_team: awayTeam,
        home_crest: homeCrest,
        away_crest: awayCrest,
        score,
        date,
        competition_name: competitionName,
        competition_logo: competitionLogo,
        matchday: matchday,
        stage,
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
      crest: data.crest || '',
      squad,
    };
  } catch (err) {
    console.error(err.message);
    return { error: 'Failed to fetch team squad' };
  }
};

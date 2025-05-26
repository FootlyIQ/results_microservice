const axios = require('axios');
const moment = require('moment-timezone');

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;
const TEAM_MATCHES_URL = process.env.TEAM_MATCHES_URL;
const TEAM_SQUAD_URL = process.env.TEAM_SQUAD_URL;
const PLAYER_URL = process.env.PLAYER_URL;
const headers = { 'X-Auth-Token': API_KEY };
const timezone = 'Europe/Madrid';

exports.getAllMatches = async (dateFilter) => {
  try {
    // Construct URL with date parameter if provided
    const url = dateFilter ? `${API_URL}?date=${dateFilter}` : API_URL;
    console.log(`Calling API URL: ${url}`);

    const response = await axios.get(url, { headers });
    console.log(`📦 Število tekem iz API-ja: ${response.data.matches.length}`);

    const countries = {};

    response.data.matches.forEach((match) => {
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

      const formattedDate = moment(match.utcDate).tz(timezone).format('DD.MM.YYYY ob HH:mm');

      let score = 'Match not played yet';

      if (status === 'Finished') {
        score = `${match.score.fullTime.home} - ${match.score.fullTime.away}`;
      } else if (status === 'Half Time') {
        score =
          match.score.halfTime?.home != null
            ? `${match.score.halfTime.home} - ${match.score.halfTime.away}`
            : 'Half Time';
      } else if (status === 'LIVE') {
        score =
          match.score.fullTime?.home != null
            ? `${match.score.fullTime.home} - ${match.score.fullTime.away}`
            : '';
      } else if (status === 'Scheduled') {
        score = formattedDate;
      }

      const matchData = {
        match_id: match.id,
        home_team: homeTeam,
        away_team: awayTeam,
        home_crest: homeCrest,
        away_crest: awayCrest,
        score,
        status,
        date: formattedDate,
        venue: match.venue || '',
        matchday: match.matchday || '',
      };

      if (!countries[country]) {
        countries[country] = {
          flag: countryFlag,
          leagues: {},
        };
      }

      if (!countries[country].leagues[league]) {
        countries[country].leagues[league] = {
          emblem: leagueEmblem,
          matches: [],
        };
      }

      countries[country].leagues[league].matches.push(matchData);
    });

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

exports.getTeamMatches = async (teamId, season = null, competition = null) => {
  try {
    let url = `${TEAM_MATCHES_URL}/${teamId}/matches`;
    const params = {};

    if (season) {
      params.season = season;
    }
    if (competition) {
      params.competitions = competition;
    }

    const response = await axios.get(url, {
      headers,
      params,
    });

    const matches = response.data.matches.map((match) => {
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

      const competitionName = match.competition?.name || 'Unknown league';
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
      id: null, // coaches don't have IDs in the API
      name: coach.name || 'Unknown',
      position: 'Manager',
      dateOfBirth: coach.dateOfBirth || 'Unknown',
      nationality: coach.nationality || 'Unknown',
    });

    data.squad.forEach((player) => {
      squad.push({
        id: player.id || null, // Include player ID
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

exports.getPlayerDetails = async (playerId) => {
  try {
    // First get the player's basic details
    const response = await axios.get(`${PLAYER_URL}/${playerId}`, { headers });
    const player = response.data;

    // Get the team ID from the player's current team
    const teamId = player.currentTeam?.id;
    let specificPosition = player.position || player.section;

    // If we have a team ID, try to get the specific position from the squad
    if (teamId) {
      try {
        const squadResponse = await axios.get(`${TEAM_SQUAD_URL}/${teamId}`, { headers });
        const squadPlayer = squadResponse.data.squad.find((p) => p.id === parseInt(playerId));
        if (squadPlayer) {
          specificPosition = squadPlayer.position;
        }
      } catch (err) {
        console.log('Could not fetch specific position from squad:', err.message);
      }
    }

    return {
      id: player.id,
      name: player.name,
      firstName: player.firstName,
      lastName: player.lastName,
      dateOfBirth: player.dateOfBirth,
      nationality: player.nationality,
      position: specificPosition,
      shirtNumber: player.shirtNumber,
      contract: player.currentTeam?.contract
        ? {
            start: player.currentTeam.contract.start,
            until: player.currentTeam.contract.until,
          }
        : { message: 'Contract information not available' },
    };
  } catch (err) {
    console.error(err.message);
    return { error: 'Failed to fetch player details' };
  }
};

exports.getPlayerMatches = async (playerId, limit = 50, season = null, competition = null) => {
  try {
    const response = await axios.get(`${PLAYER_URL}/${playerId}/matches?limit=${limit}`, {
      headers,
    });
    const data = response.data;

    // Filter matches based on season and competition
    let filteredMatches = data.matches;
    if (season || competition) {
      filteredMatches = data.matches.filter((match) => {
        const matchSeason = match.season
          ? `${match.season.startDate.substring(0, 4)}/${match.season.endDate.substring(0, 4)}`
          : null;
        const seasonMatch = !season || matchSeason === season;
        const competitionMatch = !competition || match.competition.id === parseInt(competition);
        return seasonMatch && competitionMatch;
      });
    }

    return {
      playerInfo: {
        id: data.person.id,
        name: data.person.name,
        position: data.person.position,
        nationality: data.person.nationality,
      },
      stats: {
        matchesOnPitch: filteredMatches.length,
        startingXI: data.aggregations?.startingXI || 0,
        minutesPlayed: data.aggregations?.minutesPlayed || 0,
        goals: data.aggregations?.goals || 0,
        assists: data.aggregations?.assists || 0,
        yellowCards: data.aggregations?.yellowCards || 0,
        redCards: data.aggregations?.redCards || 0,
      },
      matches: filteredMatches.map((match) => ({
        match_id: match.id,
        competition: {
          id: match.competition.id,
          name: match.competition.name,
          emblem: match.competition.emblem,
        },
        season: {
          startDate: match.season.startDate,
          endDate: match.season.endDate,
        },
        homeTeam: {
          name: match.homeTeam.name,
          crest: match.homeTeam.crest,
          score: match.score.fullTime.home,
        },
        awayTeam: {
          name: match.awayTeam.name,
          crest: match.awayTeam.crest,
          score: match.score.fullTime.away,
        },
        date: moment(match.utcDate).tz(timezone).format('DD.MM.YYYY ob HH:mm'),
        status: match.status,
        stage: match.stage,
        matchday: match.matchday,
      })),
    };
  } catch (err) {
    console.error('Error in getPlayerMatches:', err);
    return { error: 'Failed to fetch player matches' };
  }
};

exports.getTeamCompetitionsAndSeasons = async (teamId) => {
  try {
    // Get all matches for the team with a single API call
    const response = await axios.get(`${TEAM_MATCHES_URL}/${teamId}/matches`, { headers });

    // Extract unique competitions and seasons
    const competitions = new Set();
    const seasons = new Set();

    response.data.matches.forEach((match) => {
      if (match.competition) {
        competitions.add(
          JSON.stringify({
            id: match.competition.id,
            name: match.competition.name,
            code: match.competition.code,
            emblem: match.competition.emblem,
          })
        );
      }
      if (match.season) {
        seasons.add(
          JSON.stringify({
            year: `${match.season.startDate.substring(0, 4)}/${match.season.endDate.substring(
              0,
              4
            )}`,
            startDate: match.season.startDate,
            endDate: match.season.endDate,
            currentMatchday: match.season.currentMatchday,
          })
        );
      }
    });

    return {
      competitions: Array.from(competitions).map((comp) => JSON.parse(comp)),
      seasons: Array.from(seasons)
        .map((season) => JSON.parse(season))
        .sort((a, b) => {
          // Sort seasons in descending order (newest first)
          const yearA = parseInt(a.year.split('/')[0]);
          const yearB = parseInt(b.year.split('/')[0]);
          return yearB - yearA;
        }),
    };
  } catch (err) {
    console.error('Error fetching team competitions and seasons:', err.message);
    return { error: 'Failed to fetch team competitions and seasons' };
  }
};

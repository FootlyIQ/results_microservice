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
      const leagueCode = match.competition?.code || '';
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

      const formattedDate = moment(match.utcDate).tz(timezone).format('DD.MM.YYYY [at] HH:mm');

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
          code: leagueCode,
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
        code: leagueData.code,
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

      const date = moment(match.utcDate).tz(timezone).format('DD.MM.YYYY [at] HH:mm');

      const competitionName = match.competition?.name || 'Unknown league';
      const competitionLogo = match.competition?.emblem || '';
      const competitionCode = match.competition?.code || '';
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
        competition_code: competitionCode,
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
        date: moment(match.utcDate).tz(timezone).format('DD.MM.YYYY [at] HH:mm'),
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

exports.getCompetitionDetails = async (competitionCode, seasonYear) => {
  try {
    const baseUrl = 'https://api.football-data.org/v4';
    console.log('Making requests to competition endpoints...');

    // Get competition information
    const competitionResponse = await axios.get(`${baseUrl}/competitions/${competitionCode}`, {
      headers,
    });
    console.log('Competition response received');

    // Find the requested season or default to current
    const seasons = competitionResponse.data.seasons;
    let selectedSeason;

    if (seasonYear) {
      // Try to find the exact season first
      selectedSeason = seasons.find((season) => season.startDate.startsWith(seasonYear));
    }

    if (!selectedSeason) {
      // If no specific season found or none requested, find the current season
      selectedSeason = seasons.find((season) => {
        const startYear = parseInt(season.startDate.split('-')[0]);
        const endYear = parseInt(season.endDate.split('-')[0]);
        const currentYear = new Date().getFullYear();
        return currentYear >= startYear && currentYear <= endYear;
      });
    }

    if (!selectedSeason) {
      // If still no season found, use the most recent one
      selectedSeason = seasons[0];
    }

    const seasonParam = selectedSeason.startDate.split('-')[0];
    console.log('Selected season:', seasonParam);

    // Get current standings for the selected season
    const standingsResponse = await axios.get(
      `${baseUrl}/competitions/${competitionCode}/standings`,
      {
        headers,
        params: { season: seasonParam },
      }
    );
    console.log('Standings response received');

    // Get top scorers for the selected season
    const scorersResponse = await axios.get(`${baseUrl}/competitions/${competitionCode}/scorers`, {
      headers,
      params: {
        season: seasonParam,
        limit: 10,
      },
    });
    console.log('Scorers response received');

    let matchesData = { matches: [] };
    try {
      console.log('Attempting to fetch matches with params:', {
        season: seasonParam,
        competitionCode,
      });

      const matchesResponse = await axios.get(
        `${baseUrl}/competitions/${competitionCode}/matches`,
        {
          headers,
          params: {
            season: seasonParam,
            limit: 100,
          },
        }
      );
      console.log('Matches response received');

      // Sort matches by matchday in descending order and then by date
      const sortedMatches = matchesResponse.data.matches.sort((a, b) => {
        // First sort by matchday in descending order
        if (a.matchday !== b.matchday) {
          return b.matchday - a.matchday;
        }
        // If same matchday, sort by date
        return new Date(a.utcDate) - new Date(b.utcDate);
      });

      // Create array of available seasons with year ranges, but only include recent seasons (2023 onwards)
      // and only seasons that actually have match data
      const availableSeasons = seasons
        .filter((season) => {
          const startYear = parseInt(season.startDate.split('-')[0]);
          // Only include seasons from 2023 onwards
          return startYear >= 2023;
        })
        .map((season) => ({
          id: season.id,
          year: parseInt(season.startDate.split('-')[0]),
          label: `${season.startDate.split('-')[0]}/${season.endDate.split('-')[0]}`,
        }))
        .sort((a, b) => b.year - a.year); // Sort by year in descending order

      matchesData = {
        ...matchesResponse.data,
        matches: sortedMatches,
        availableSeasons,
      };
    } catch (matchError) {
      console.log('Could not fetch matches. Error details:', {
        message: matchError.message,
        response: matchError.response?.data,
        status: matchError.response?.status,
        url: matchError.config?.url,
        params: matchError.config?.params,
      });

      // Even if matches fail, still provide filtered available seasons
      const availableSeasons = seasons
        .filter((season) => {
          const startYear = parseInt(season.startDate.split('-')[0]);
          return startYear >= 2023;
        })
        .map((season) => ({
          id: season.id,
          year: parseInt(season.startDate.split('-')[0]),
          label: `${season.startDate.split('-')[0]}/${season.endDate.split('-')[0]}`,
        }))
        .sort((a, b) => b.year - a.year);

      matchesData = { matches: [], availableSeasons };
    }

    return {
      competition: {
        ...competitionResponse.data,
        currentSeason: selectedSeason,
        // Filter seasons to only include 2023 onwards, same as availableSeasons
        seasons: competitionResponse.data.seasons.filter((season) => {
          const startYear = parseInt(season.startDate.split('-')[0]);
          return startYear >= 2023;
        }),
      },
      standings: standingsResponse.data,
      scorers: scorersResponse.data,
      matches: matchesData,
    };
  } catch (err) {
    console.error('Error fetching competition details:', err.message);
    if (err.response) {
      console.error('API Error details:', {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data,
      });
      const message = err.response.data?.message || err.response.data?.error || err.message;
      return { error: `API Error: ${message}` };
    }
    return { error: 'Failed to fetch competition details' };
  }
};

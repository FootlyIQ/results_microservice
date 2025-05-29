const axios = require('axios');
const moment = require('moment-timezone');

const API_KEY = process.env.API_KEY;
const MATCH_DETAILS_URL = process.env.MATCH_DETAILS_URL;
const headers = { 'X-Auth-Token': API_KEY };
const timezone = 'Europe/Madrid';

exports.getMatchStatistics = async (matchId) => {
  try {
    console.log(`Kličem API za statistiko tekme z ID: ${matchId}`);
    const response = await axios.get(`${MATCH_DETAILS_URL}/${matchId}`, { headers });
    //console.log('API odgovor:', response.data);

    const match = response.data.match || response.data;

    // Try to fetch current standings to get league ranks
    let standings = null;
    if (match.competition?.code) {
      try {
        // Try to get the season year from the match date
        let seasonYear = new Date().getFullYear(); // Default to current year
        if (match.utcDate) {
          const matchDate = new Date(match.utcDate);
          const matchYear = matchDate.getFullYear();
          const matchMonth = matchDate.getMonth() + 1; // getMonth() returns 0-11

          // If match is in first half of year (Jan-July), it's likely from previous season
          // If match is in second half (Aug-Dec), it's likely from current season
          if (matchMonth <= 7) {
            seasonYear = matchYear - 1;
          } else {
            seasonYear = matchYear;
          }
        }

        console.log(
          `Fetching standings for season ${seasonYear} for competition ${match.competition.code}`
        );

        const standingsResponse = await axios.get(
          `https://api.football-data.org/v4/competitions/${match.competition.code}/standings`,
          {
            headers,
            params: { season: seasonYear },
          }
        );
        standings = standingsResponse.data.standings[0]?.table || [];
        console.log(`Successfully fetched standings with ${standings.length} teams`);
      } catch (standingsError) {
        console.log('Could not fetch standings for league ranks:', standingsError.message);
        // Try with current year as fallback
        try {
          const currentYear = new Date().getFullYear();
          console.log(`Trying fallback with current year ${currentYear}`);
          const fallbackResponse = await axios.get(
            `https://api.football-data.org/v4/competitions/${match.competition.code}/standings`,
            {
              headers,
              params: { season: currentYear },
            }
          );
          standings = fallbackResponse.data.standings[0]?.table || [];
          console.log(`Fallback successful, fetched ${standings.length} teams`);
        } catch (fallbackError) {
          console.log('Fallback also failed:', fallbackError.message);
        }
      }
    }

    const formatScore = (scoreObj) =>
      scoreObj?.home != null && scoreObj?.away != null
        ? `${scoreObj.home} - ${scoreObj.away}`
        : null;

    const formatTeam = (team) => {
      // Try to find league rank from standings
      let leagueRank = 'Unknown';
      if (standings && team.id) {
        const teamInStandings = standings.find((row) => row.team.id === team.id);
        if (teamInStandings) {
          leagueRank = teamInStandings.position;
        }
      }

      return {
        id: team.id || null,
        name: team.name || 'Unknown',
        shortName: team.shortName || '',
        tla: team.tla || '',
        crest: team.crest || '',
        coach: team.coach || { name: 'Unknown', nationality: 'Unknown' },
        leagueRank: leagueRank,
        formation: team.formation || 'Unknown',
        lineup: team.lineup || [],
        bench: team.bench || [],
      };
    };

    const homeTeam = formatTeam(match.homeTeam || {});
    const awayTeam = formatTeam(match.awayTeam || {});

    const generalInfo = {
      match_id: matchId,
      date: moment(match.utcDate).tz(timezone).format('DD.MM.YYYY ob HH:mm'),
      status: match.status,
      venue: match.venue || 'No venue info',
      duration: match.score?.duration || 'No duration info',
      competition: match.competition?.name || null,
      full_time_score: formatScore(match.score?.fullTime),
      half_time_score: formatScore(match.score?.halfTime),
      penalty_score: formatScore(match.score?.penalties),
      referees: match.referees?.length ? match.referees : 'No referee data',
    };

    const extraInfo = {
      competition: match.competition || null,
      goals: match.goals?.length ? match.goals : 'No goals yet',
      bookings: match.bookings?.length ? match.bookings : 'No bookings yet',
      substitutions: match.substitutions?.length ? match.substitutions : 'No substitutions yet',
    };

    const statistics = {
      homeTeam: {
        ...formatStatistics(match.homeTeam?.statistics),
        goals: match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? 0,
      },
      awayTeam: {
        ...formatStatistics(match.awayTeam?.statistics),
        goals: match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? 0,
      },
    };

    return {
      generalInfo,
      homeTeam,
      awayTeam,
      extraInfo,
      statistics,
    };
  } catch (err) {
    console.error('Napaka pri klicu API-ja:', err.message);
    return { error: 'Failed to fetch match statistics' };
  }
};

const formatStatistics = (stats = {}) => ({
  corner_kicks: stats.corner_kicks ?? 'No data',
  free_kicks: stats.free_kicks ?? 'No data',
  goal_kicks: stats.goal_kicks ?? 'No data',
  offsides: stats.offsides ?? 'No data',
  fouls: stats.fouls ?? 'No data',
  ball_possession: stats.ball_possession ?? 'No data',
  saves: stats.saves ?? 'No data',
  throw_ins: stats.throw_ins ?? 'No data',
  shots: stats.shots ?? 'No data',
  shots_on_goal: stats.shots_on_goal ?? 'No data',
  shots_off_goal: stats.shots_off_goal ?? 'No data',
  yellow_cards: stats.yellow_cards ?? 'No data',
  yellow_red_cards: stats.yellow_red_cards ?? 'No data',
  red_cards: stats.red_cards ?? 'No data',
});

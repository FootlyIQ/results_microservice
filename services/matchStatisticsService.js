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
    console.log('API odgovor:', response.data);

    const match = response.data.match || response.data;

    const formatScore = (scoreObj) =>
      scoreObj?.home != null && scoreObj?.away != null
        ? `${scoreObj.home} - ${scoreObj.away}`
        : 'No data';

    const formatTeam = (team) => ({
      id: team.id || null,
      name: team.name || 'Unknown',
      shortName: team.shortName || '',
      tla: team.tla || '',
      crest: team.crest || '',
      coach: team.coach || { name: 'Unknown', nationality: 'Unknown' },
      leagueRank: team.leagueRank || 'Unknown',
      formation: team.formation || 'Unknown',
      lineup: team.lineup || [],
      bench: team.bench || [],
    });

    const homeTeam = formatTeam(match.homeTeam || {});
    const awayTeam = formatTeam(match.awayTeam || {});

    const generalInfo = {
      match_id: matchId,
      date: moment(match.utcDate).tz(timezone).format('DD.MM.YYYY ob HH:mm'),
      status: ['IN_PLAY', 'LIVE', 'PAUSED'].includes(match.status)
        ? 'LIVE'
        : match.status === 'FINISHED'
        ? 'Finished'
        : 'Scheduled',

      venue: match.venue || 'No venue info',
      duration: match.score?.duration || 'No duration info',
      full_time_score: formatScore(match.score?.fullTime),
      half_time_score: formatScore(match.score?.halfTime),
      penalty_score: formatScore(match.score?.penalties),
      referees: match.referees?.length ? match.referees : 'No referee data',
    };

    const extraInfo = {
      goals: match.goals?.length ? match.goals : 'No goals yet',
      bookings: match.bookings?.length ? match.bookings : 'No bookings yet',
      substitutions: match.substitutions?.length ? match.substitutions : 'No substitutions yet',
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

    const statistics = {
      homeTeam: formatStatistics(match.homeTeam?.statistics),
      awayTeam: formatStatistics(match.awayTeam?.statistics),
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

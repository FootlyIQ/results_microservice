require('dotenv').config();
const express = require('express');
const footballRoutes = require('./routes/matches');
const matchStatisticsRoutes = require('./routes/matchStatistics');

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/api', footballRoutes);
app.use('/match', matchStatisticsRoutes);

app.listen(PORT, () => {
  console.log(`Football microservice listening on port ${PORT}`);
});

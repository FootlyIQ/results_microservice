require('dotenv').config();
const express = require('express');
const footballRoutes = require('./routes/matches');

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/api', footballRoutes);

app.listen(PORT, () => {
  console.log(`Football microservice listening on port ${PORT}`);
});

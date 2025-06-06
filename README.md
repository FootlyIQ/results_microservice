# ⚽ FootlyIQ Microservice

This microservice fetches real-time football data including matches, team information, player details, and statistics from [Football-data.org API](https://www.football-data.org/).

---

## 🚀 Features

- Supports multiple football leagues (EPL, La Liga, Bundesliga, Serie A, Ligue 1, UEFA Champions League, and more)
- Fetches live match results and schedules
- Provides detailed team information and squad data
- Returns player profiles and match statistics
- Competition standings and top scorers
- Advanced search functionality for teams and players
- Built with **Node.js**, **Express**, and **Axios**
- Easily deployable to cloud services

---

## 📦 Technologies

- Node.js
- Express.js
- Axios
- Moment-timezone (for date formatting)
- Dotenv (for API key management)

---

## 📁 Project Structure

```
FootlyIQ-Microservice/
├── routes/
│   ├── matches.js
│   └── matchStatistics.js
├── services/
│   ├── matchesService.js
│   └── matchStatisticsService.js
├── .env
├── index.js
├── package.json
├── .gitignore
└── README.md
```

---

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd FootlyIQ-Microservice
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a .env file

Create a .env file in the root directory and add your Football-data.org API key:

```env
API_KEY=your_football_data_org_api_key_here
API_URL=https://api.football-data.org/v4/matches
TEAM_MATCHES_URL=https://api.football-data.org/v4/teams
TEAM_SQUAD_URL=https://api.football-data.org/v4/teams
PLAYER_URL=https://api.football-data.org/v4/persons
MATCH_DETAILS_URL=https://api.football-data.org/v4/matches
```

### 4. Run Locally

```bash
node index.js
```

The server will start on:

```
http://localhost:3000
```

---

## 📡 API Endpoints

### Match Endpoints

- `GET /api/matches` - Get all matches (optional: ?date=YYYY-MM-DD)
- `GET /api/team/:teamId/matches` - Get team matches (optional: ?season=2024&competition=PL)
- `GET /match/:matchId/statistics` - Get detailed match statistics

### Team Endpoints

- `GET /api/team/:teamId/squad` - Get team squad information
- `GET /api/team/:teamId/filters` - Get available competitions and seasons for a team

### Player Endpoints

- `GET /api/player/:playerId` - Get player details
- `GET /api/player/:playerId/matches` - Get player match history

### Competition Endpoints

- `GET /api/competition/:competitionCode` - Get competition details and standings

### Search Endpoints

- `GET /api/search/teams?q=search_term` - Search teams by name
- `GET /api/search/players?q=search_term&team_id=123` - Search players by name

---

## 📊 Sample API Response

### GET /api/matches

```json
[
  {
    "country": "England",
    "flag": "https://crests.football-data.org/770.svg",
    "leagues": [
      {
        "league": "Premier League",
        "emblem": "https://crests.football-data.org/PL.png",
        "code": "PL",
        "matches": [
          {
            "match_id": 12345,
            "home_team": "Manchester United",
            "away_team": "Liverpool",
            "home_crest": "https://crests.football-data.org/66.svg",
            "away_crest": "https://crests.football-data.org/64.svg",
            "score": "2 - 1",
            "status": "Finished",
            "date": "15.12.2024 at 16:30",
            "venue": "Old Trafford",
            "matchday": 16
          }
        ]
      }
    ]
  }
]
```

### GET /api/player/:playerId

```json
{
  "id": 44,
  "name": "Cristiano Ronaldo",
  "firstName": "Cristiano",
  "lastName": "Ronaldo",
  "dateOfBirth": "1985-02-05",
  "nationality": "Portugal",
  "position": "Centre-Forward",
  "shirtNumber": 7,
  "contract": {
    "start": "2021-08-31",
    "until": "2024-06-30"
  }
}
```

---

## 🔗 Integration

You can easily consume this microservice from any application. Example usage:

### JavaScript/Node.js

```javascript
const response = await fetch('http://localhost:3000/api/matches');
const matches = await response.json();
```

### Python

```python
import requests
response = requests.get('http://localhost:3000/api/matches')
matches = response.json()
```

---

## 🌐 Deployment

This microservice can be easily deployed to cloud platforms like:

- Render
- Heroku
- Vercel
- Railway
- DigitalOcean App Platform

Make sure to set your environment variables in your deployment platform.

---

## 📝 Notes

- Requires a valid API key from [Football-data.org](https://www.football-data.org/)
- Free tier allows 10 requests per minute
- Paid plans for more leagues and informations, the free plan covers almost nothing
- Paid plans available for higher usage limits
- All dates are returned in Europe/Madrid timezone
- Match statuses: `SCHEDULED`, `LIVE`, `IN_PLAY`, `PAUSED`, `FINISHED`

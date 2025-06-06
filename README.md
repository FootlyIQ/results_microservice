# 🧠 Results Microservice

This microservice fetches real-time results, statistics, players, teams for various football competititons/leagues from [The Football-data.org]([(https://www.football-data.org/])).

---

## 🚀 Features

- Supports multiple football leagues (EPL, UEFA CL, La Liga, Bundesliga, Serie A, Ligue 1, Brazil Série A)
- Fetches `head-to-head` (h2h) odds only
- Returns results in ISO date format with decimal odds
- Filtered exclusively to the **Marathon Bet** provider
- Built with **Node.js**, **Express**, and **Axios**
- Easily deployable to services like Render

---

## 📦 Technologies

- Node.js
- Express
- Axios
- Dotenv (for managing API keys)
- Render (for cloud deployment)

---

## 📁 Project Structure
bets_microservice/
-  .env
-  index.js
-  package.json
-  .gitignore
-  README.md


## 🔧 Setup Instructions

### 1. Clone the Repository
### 2. Install dependencies
npm install
### 3. Create a .env file
Create a .env file in the root directory and insert your The Odds API key:
API_KEY=your_api_key_here
### 4. Run locally
node index.js
#### The server will start on:
http://localhost:3001/odds

## 📡 API Usage
#### Endpoint:
GET /odds
#### Sample response:
[
  {
    "id": "f799cdfb03518c76b275f9be01ed4214",
    "sport_title": "UEFA Champions League",
    "commence_time": "2025-05-31T19:00:00Z",
    "home_team": "Paris Saint Germain",
    "away_team": "Internazionale Milano",
    "bookmakers": [
      {
        "title": "Marathon Bet",
        "markets": [
          {
            "key": "h2h",
            "outcomes": [
              { "name": "Paris Saint Germain", "price": 2.24 },
              { "name": "Internazionale Milano", "price": 3.4 },
              { "name": "Draw", "price": 3.28 }
            ]
          }
        ]
      }
    ]
  }
]


## 🔗 Integration
You can easily consume this microservice from a Flask backend or a React frontend. Example usage in Flask (for a deployed microservice via render):

requests.get("https://bets-microservice.onrender.com/odds")

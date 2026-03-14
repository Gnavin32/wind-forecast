# 🌬️ UK Wind Power Forecast App

## Overview
A web app to visualize UK national wind power generation forecasts vs actual generation for January 2024.

## Live App
👉 https://wind-forecast-three.vercel.app

## Files
- `src/App.js` - Main React application
- `wind_analysis.ipynb` - Jupyter notebook with forecast error analysis

## How to Run
1. Install dependencies:
   npm install
2. Start the app:
   npm start
3. Open http://localhost:3000

## Analysis Summary
- Mean Absolute Error: 2,085 MW
- Forecast bias: +1,359 MW over-forecasting
- Recommended reliable wind baseline: 5,000 MW (available 90.5% of time)

## Built With
- React + Recharts
- Elexon BMRS API
- Python + Jupyter + Pandas + Matplotlib
- Deployed on Vercel

## AI Tools Used
- Claude (Anthropic) was used to assist with building this application
import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function App() {
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-01-02');
  const [horizon, setHorizon] = useState(4);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const floorToHour = (isoString) => {
    const d = new Date(isoString);
    d.setUTCMinutes(0, 0, 0);
    return d.toISOString().replace('.000Z', 'Z');
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    setChartData([]);

    try {
      const actualRes = await fetch(
        `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?settlementDateFrom=${startDate}&settlementDateTo=${endDate}`
      );
      const actualJson = await actualRes.json();

      const forecastFrom = new Date(startDate);
      forecastFrom.setDate(forecastFrom.getDate() - 35);
      const forecastFromStr = forecastFrom.toISOString().split('T')[0];

      const forecastRes = await fetch(
        `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream?publishDateTimeFrom=${forecastFromStr}T00:00:00Z&publishDateTimeTo=${endDate}T23:59:59Z`
      );
      const forecastJson = await forecastRes.json();

      console.log('Actual records:', actualJson.length);
      console.log('Forecast records:', forecastJson.length);

      const actuals = actualJson.filter(d => d.fuelType === 'WIND');

      const actualMap = {};
      actuals.forEach(d => {
        actualMap[d.startTime] = d.generation;
      });

      const forecastMap = {};
      forecastJson.forEach(d => {
        const targetTime = new Date(d.startTime).getTime();
        const publishTime = new Date(d.publishTime).getTime();
        const diffHours = (targetTime - publishTime) / (1000 * 60 * 60);

        if (diffHours >= horizon) {
          const key = d.startTime;
          if (
            !forecastMap[key] ||
            new Date(d.publishTime) > new Date(forecastMap[key].publishTime)
          ) {
            forecastMap[key] = d;
          }
        }
      });

      console.log('Forecast map size:', Object.keys(forecastMap).length);

      const combined = Object.keys(actualMap).map(time => {
        const dateObj = new Date(time);
        const hourKey = floorToHour(time);
        const forecastValue = forecastMap[hourKey];

        return {
          time: dateObj.toLocaleString('en-GB', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
          }),
          rawTime: dateObj.getTime(),
          actual: actualMap[time],
          forecast: forecastValue ? forecastValue.generation : null,
        };
      });

      combined.sort((a, b) => a.rawTime - b.rawTime);

      const forecastCount = combined.filter(d => d.forecast !== null).length;
      console.log('Total points:', combined.length, 'With forecast:', forecastCount);

      setChartData(combined);

    } catch (err) {
      console.error(err);
      setError('Failed to fetch data. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Arial', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{ color: '#1a1a2e' }}>🌬️ UK Wind Power Forecast</h1>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div>
          <label>Start Date<br />
            <input type="date" value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </label>
        </div>
        <div>
          <label>End Date<br />
            <input type="date" value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </label>
        </div>
        <div>
          <label>Forecast Horizon: {horizon}h<br />
            <input type="range" min="0" max="48" value={horizon}
              onChange={e => setHorizon(Number(e.target.value))}
              style={{ width: '160px', marginTop: '8px' }} />
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={fetchData}
            style={{
              padding: '10px 24px', backgroundColor: '#4f46e5', color: 'white',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px'
            }}>
            {loading ? 'Loading...' : 'Load Data'}
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis label={{ value: 'Power (MW)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="actual" stroke="#2563eb" dot={false} name="Actual" />
            <Line type="monotone" dataKey="forecast" stroke="#16a34a" dot={false} name="Forecast" strokeWidth={2} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {!loading && chartData.length === 0 && !error && (
        <p style={{ color: '#888' }}>Select a date range and click "Load Data" to see the chart.</p>
      )}
    </div>
  );
}

export default App;
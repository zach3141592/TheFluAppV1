'use client';

import { useState, useEffect } from 'react';
import { getFluRiskPrediction, PredictionResponse } from '@/lib/api';

export default function PredictionDisplay() {
  const [predictions, setPredictions] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoading(true);
        const data = await getFluRiskPrediction();
        setPredictions(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch predictions');
        console.error('Error fetching predictions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  if (loading) {
    return <div className="p-4">Loading predictions...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!predictions) {
    return <div className="p-4">No predictions available</div>;
  }

  return (
    <div className="p-4 space-y-6">
      {/* National Risk */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-bold mb-2">National Risk Index</h2>
        <p className="text-2xl font-semibold">{predictions.national_risk.toFixed(1)}</p>
      </div>

      {/* Provincial Risks */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-bold mb-4">Provincial Risk Indices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(predictions.provincial_risks).map(([province, risk]) => (
            <div key={province} className="border p-3 rounded">
              <h3 className="font-semibold">{province}</h3>
              <p className="text-lg">{risk.toFixed(1)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* City Risks */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-bold mb-4">City Risk Indices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(predictions.current_city_risks).map(([city, risk]) => (
            <div key={city} className="border p-3 rounded">
              <h3 className="font-semibold">{city}</h3>
              <p className="text-lg">{risk.toFixed(1)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Future Risks */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-bold mb-4">Future Risk Predictions (Next 7 Days)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(predictions.future_risks).map(([key, risk]) => {
            const [city, date] = key.split('_');
            return (
              <div key={key} className="border p-3 rounded">
                <h3 className="font-semibold">{city}</h3>
                <p className="text-sm text-gray-600">{date}</p>
                <p className="text-lg">{risk.toFixed(1)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 
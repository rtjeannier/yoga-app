import React, { useState, useEffect } from 'react';
import './App.css';
import YogaBoard from './components/YogaBoard.jsx';
import { initializePoses } from './poseLookup.js';

function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [poses, setPoses] = useState({});

  useEffect(() => {
    initializePoses()
      .then((loadedPoses) => {
        setPoses(loadedPoses);
        setReady(true);
      })
      .catch(err => setError(err.message));
  }, []);

  if (error) return <div>Error loading poses: {error}</div>;
  if (!ready) return <div>Loading poses...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Yoga Flow Builder</h1>
        <YogaBoard poses={poses} />
      </div>
    </div>
  );
}

export default App;
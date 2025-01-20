import React, { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import YogaCard from './components/YogaCard.jsx';
import Papa from 'papaparse';


import { initializePoses, getPose } from './poseLookup.js';

function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializePoses()
      .then(() => setReady(true))
      .catch(err => setError(err.message));
  }, []);

  if (error) return <div>Error loading poses: {error}</div>;
  if (!ready) return <div>Loading poses...</div>;

  // Example usage
  const mountainPose = getPose("Mountain Pose");
  const downwardDog = getPose("Downward Dog");

  return (
    <div className="p-4">
      <YogaCard {...mountainPose} />
      <YogaCard {...downwardDog} />
    </div>
  );
}

export default App


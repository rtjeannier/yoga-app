// poseLookup.js
import Papa from 'papaparse';

export const POSE_POSITIONS = {
  INVERSION: 'inversion',
  STANDING: 'standing',
  KNEELING: 'kneeling',
  SUPINE: 'supine',
  PRONE: 'prone'
};

// Create array of all position values for iteration
export const POSITION_TYPES = Object.values(POSE_POSITIONS);

let poseCache = null;

const mapPoseData = (csvPose) => ({
  name: csvPose.name,
  categories: csvPose.categories ? csvPose.categories.split('|') : [],
  positions: POSITION_TYPES
    .filter(pos => csvPose[pos] !== null && csvPose[pos] >= 0),
  transitions: Object.fromEntries(
    POSITION_TYPES
      .filter(pos => csvPose[pos] !== null)
      .map(pos => [pos, csvPose[pos].toString()])
  )
});

export const initializePoses = async () => {
  if (poseCache) return poseCache;

  const response = await fetch('/poses.csv');
  const csvText = await response.text();
  const { data } = Papa.parse(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  });

  poseCache = data.reduce((poses, pose) => ({
    ...poses,
    [pose.name]: mapPoseData(pose)
  }), {});

  return poseCache;
};

export const getPose = (poseName) => {
  if (!poseCache) {
    throw new Error('Poses not initialized. Call initializePoses first.');
  }
  return poseCache[poseName];
};

export const getPosesByCategory = (category) => {
  if (!poseCache) {
    throw new Error('Poses not initialized. Call initializePoses first.');
  }
  
  return Object.values(poseCache).filter(pose => 
    pose.categories.includes(category)
  );
};
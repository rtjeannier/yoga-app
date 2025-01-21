import React from 'react';
import { POSE_POSITIONS, POSITION_TYPES } from '../poseLookup.js';

// Colors for positions
const POSITION_COLORS = {
  [POSE_POSITIONS.INVERSION]: '#8F00FF',
  [POSE_POSITIONS.STANDING]: '#228B22',
  [POSE_POSITIONS.KNEELING]: '#DAA520',
  //[POSE_POSITIONS.SEATED]: '#CD853F',
  [POSE_POSITIONS.SUPINE]: '#4169E1',
  [POSE_POSITIONS.PRONE]: '#B22222'
};

const YogaCard = ({ 
  name = "Unnamed Pose",
  positions = [],
  categories=[],
  transitions = {}
}) => {
  // Card dimensions
  const CARD_WIDTH = 175;
  const CARD_HEIGHT = 300;
  const BAR_WIDTH = 20;
  const BAR_HEIGHT = 30;
  
  // Calculate spacing
  const POSITION_AREA_START = 70;
  const POSITION_AREA_END = 270;
  const availableHeight = POSITION_AREA_END - POSITION_AREA_START;
  const spacing = availableHeight / (POSITION_TYPES.length - 1);

  return (
    <svg 
      viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
      width={CARD_WIDTH}
      height={CARD_HEIGHT}
    >
      {/* Card background */}
      <rect width={CARD_WIDTH} height={CARD_HEIGHT} fill="white" stroke="black"/>
      
      {/* Card title */}
      <text x={CARD_WIDTH/2} y="30" textAnchor="middle" fontFamily="Arial" fontWeight="bold">
        {name}
      </text>
      
      {/* Position and transition bars */}
      {POSITION_TYPES.map((position, index) => {
        const yPos = POSITION_AREA_START + (spacing * index);
        const isActive = categories.includes(position);
        const transitionValue = transitions[position];
        const color = POSITION_COLORS[position];
        
        return (
          <g key={position}>
            {/* Left side position bar - only if position is active */}
            {isActive && (
              <rect
                x={0}
                y={yPos}
                width={BAR_WIDTH}
                height={BAR_HEIGHT}
                fill={color}
              />
            )}
            
            {/* Right side transition bar - only if transition exists */}
            {transitionValue !== undefined && (
              <g>
                <rect
                  x={CARD_WIDTH - BAR_WIDTH}
                  y={yPos}
                  width={BAR_WIDTH}
                  height={BAR_HEIGHT}
                  fill={color}
                />
                {transitionValue !== "0" && (
                  <>
                    <circle 
                      cx={CARD_WIDTH - BAR_WIDTH/2}
                      cy={yPos + BAR_HEIGHT/2}
                      r="8"
                      fill="white"
                      stroke={color}
                    />
                    <text
                      x={CARD_WIDTH - BAR_WIDTH/2}
                      y={yPos + BAR_HEIGHT/2 + 4}
                      textAnchor="middle"
                      fontSize="10"
                      fill={color}
                    >
                      {Number(transitionValue) > 0 ? `+${transitionValue}` : transitionValue}
                    </text>
                  </>
                )}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default YogaCard;
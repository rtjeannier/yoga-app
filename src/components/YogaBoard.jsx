import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import YogaCard from './YogaCard';

// This object holds all our measurements and layout settings in one place
// It's better to have these as constants rather than magic numbers throughout the code
// Could be moved to a separate config.js file to make the code cleaner
const GRID_CONFIG = {
  CELL_WIDTH: 180,      // Width of each card cell in pixels
  CELL_HEIGHT: 300,     // Height of each card cell in pixels
  SPACING: 20,          // Space between cards
  MIN_COLS: 3,          // Minimum number of columns allowed
  MAX_COLS: 6,          // Maximum number of columns allowed
  HORIZONTAL_PADDING: 100, // Padding on the sides of the board
};

// Defines the different areas where cards can be placed
// Each zone has its own properties like size and title
// This could also be moved to a separate file for better organization
const ZONES = {
  draw: {
    id: 'draw',
    type: 'draw',
    title: 'Draw Zone',
  },
  player1: {
    id: 'player1',
    type: 'player',
    title: 'Player 1 Hand',
    maxCards: 10,
    rows: 1,
    cols: 10,
  }
};

// This component makes a YogaCard draggable
// It wraps the YogaCard component and adds drag and drop functionality
const DraggableYogaCard = ({ pose, position, zoneId }) => {
  // useDrag is a hook from react-dnd that makes something draggable
  // - type: identifies what kind of thing we're dragging (like pieces in a chess game)
  // - item: the data that gets passed when we drag (card ID and where it came from)
  // - collect: gives us info about the drag state (are we currently dragging?)
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'YOGA_CARD',
    item: { 
      id: pose.name,
      sourceZoneId: zoneId 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // The ref={drag} is what makes this div draggable
  // position.x/y determine where the card appears in the grid
  // We multiply by CELL_WIDTH/HEIGHT plus SPACING to position cards in a grid
  return (
    <div 
      ref={drag} 
      className="absolute transition-all duration-200"
      style={{
        opacity: isDragging ? 0.5 : 1,
        left: position.x * (GRID_CONFIG.CELL_WIDTH + GRID_CONFIG.SPACING),
        top: position.y * (GRID_CONFIG.CELL_HEIGHT + GRID_CONFIG.SPACING),
        cursor: 'move',
        zIndex: isDragging ? 1000 : 1
      }}
    >
      <YogaCard {...pose} />
    </div>
  );
};

// The Zone component creates a droppable area where cards can be placed
// It handles both the draw zone (where cards start) and player zones
const Zone = ({ zone, children, onDrop, cardCount, maxColumns }) => {
  // Calculate how many rows and columns this zone should have
  // This is complex because the draw zone size changes based on card count
  // while player zones have fixed dimensions
  const getZoneDimensions = () => {
    if (zone.type === 'draw') {
      const numCards = cardCount || 0;
      const columns = Math.max(GRID_CONFIG.MIN_COLS, Math.min(maxColumns, cardCount));
      const rows = Math.ceil(numCards / columns);
      return {
        cols: columns,
        rows: rows
      };
    }
    return {
      cols: zone.cols,
      rows: zone.rows,
    };
  };
  
  const dimensions = getZoneDimensions();
  
  // useDrop makes this zone a valid drop target for dragged cards
  // When something is dropped here, we:
  // 1. Calculate where in the grid it was dropped
  // 2. Make sure it's within bounds
  // 3. Tell the parent component about the drop
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'YOGA_CARD',
    drop: (item, monitor) => {
      // Get the pixel coordinates where the card was dropped
      const dropOffset = monitor.getClientOffset();
      const zoneBounds = document.getElementById(zone.id).getBoundingClientRect();
      
      // Convert pixel coordinates to grid coordinates
      const relativeX = Math.floor((dropOffset.x - zoneBounds.left) / (GRID_CONFIG.CELL_WIDTH + GRID_CONFIG.SPACING));
      const relativeY = Math.floor((dropOffset.y - zoneBounds.top) / (GRID_CONFIG.CELL_HEIGHT + GRID_CONFIG.SPACING));
      
      // Make sure the coordinates are within the zone's bounds
      const x = Math.min(Math.max(0, relativeX), dimensions.cols - 1);
      const y = Math.min(Math.max(0, relativeY), dimensions.rows - 1);
      
      onDrop(item.id, { x, y }, zone.id);
      return { moved: true };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [dimensions]);

  // Calculate the actual pixel dimensions of the zone based on the grid size
  const width = dimensions.cols * (GRID_CONFIG.CELL_WIDTH + GRID_CONFIG.SPACING) - GRID_CONFIG.SPACING;
  const height = dimensions.rows * (GRID_CONFIG.CELL_HEIGHT + GRID_CONFIG.SPACING) - GRID_CONFIG.SPACING;

  return (
    <div 
      id={zone.id}
      ref={drop}
      className={`relative p-4 rounded-lg mb-4 ${zone.type === 'draw' ? 'bg-indigo-50 border-indigo-500' : 'bg-blue-50 border-blue-500'} border-4`}
      style={{
        width,
        minHeight: height,
      }}
    >
      <div className="font-bold text-xl mb-4 p-2 bg-white rounded">
        {zone.title}
      </div>
      <div className="relative" style={{ height }}>
        {children}
      </div>
    </div>
  );
};

// The main component that puts everything together
const YogaBoard = ({ poses }) => {
  // Calculate how many columns we can fit based on screen width
  // This makes the board responsive to different screen sizes
  const [maxColumns, setMaxColumns] = useState(() => {
    const availableWidth = window.innerWidth - (GRID_CONFIG.HORIZONTAL_PADDING * 2);
    const calculatedCols = Math.floor(availableWidth / (GRID_CONFIG.CELL_WIDTH + GRID_CONFIG.SPACING));
    return Math.min(
      Math.max(GRID_CONFIG.MIN_COLS, calculatedCols),
      GRID_CONFIG.MAX_COLS
    );
  });

  // Add a listener to update column count when window is resized
  // useEffect is like saying "do this side effect when the component renders"
  useEffect(() => {
    const handleResize = () => {
      const availableWidth = window.innerWidth - (GRID_CONFIG.HORIZONTAL_PADDING * 2);
      const calculatedCols = Math.floor(availableWidth / (GRID_CONFIG.CELL_WIDTH + GRID_CONFIG.SPACING));
      const newMaxColumns = Math.min(
        Math.max(GRID_CONFIG.MIN_COLS, calculatedCols),
        GRID_CONFIG.MAX_COLS
      );
      setMaxColumns(newMaxColumns);
    };

    window.addEventListener('resize', handleResize);
    // Clean up the listener when component unmounts
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keep track of where all cards are
  // This is the main state that tracks card positions
  const [cardPositions, setCardPositions] = useState(() => {
    const numCards = Object.keys(poses).length;
    return Object.keys(poses).reduce((acc, poseName, index) => {
      return {
        ...acc,
        [poseName]: {
          x: index % maxColumns,
          y: Math.floor(index / maxColumns),
          zoneId: 'draw'
        }
      };
    }, {});
  });

  // When cards are moved in the draw zone, we need to rearrange them
  // to maintain a nice grid layout
  const reflowDrawZone = (positions) => {
    // Get all cards currently in the draw zone
    const drawCards = Object.entries(positions)
      .filter(([_, pos]) => pos.zoneId === 'draw')
      .map(([cardId]) => cardId);
    
    // Calculate how many columns we need
    const numCards = drawCards.length;
    const columns = Math.max(GRID_CONFIG.MIN_COLS, Math.min(maxColumns, Math.ceil(numCards / 2)));
    
    // Create new positions for all cards in the draw zone
    const newPositions = {};
    drawCards.forEach((cardId, index) => {
      newPositions[cardId] = {
        x: index % columns,
        y: Math.floor(index / columns),
        zoneId: 'draw'
      };
    });
    
    return {
      ...positions,
      ...newPositions
    };
  };

  // Handle when a card is dropped somewhere
  const handleDrop = (cardId, newPosition, zoneId) => {
    setCardPositions(prev => {
      // Check if there's already a card in the target position
      const cardsInZone = Object.entries(prev)
        .filter(([_, pos]) => pos.zoneId === zoneId);
      
      const isOccupied = cardsInZone.some(([_, pos]) => 
        pos.x === newPosition.x && pos.y === newPosition.y
      );

      if (isOccupied) {
        return prev;
      }

      // Update the dropped card's position
      const newPositions = {
        ...prev,
        [cardId]: {
          ...newPosition,
          zoneId
        }
      };

      // If we dropped in the draw zone, rearrange all cards there
      return zoneId === 'draw' ? reflowDrawZone(newPositions) : newPositions;
    });
  };

  // Group cards by which zone they're in
  // This makes it easier to render them in the right places
  const cardsByZone = Object.entries(cardPositions).reduce((acc, [cardId, position]) => {
    if (!acc[position.zoneId]) {
      acc[position.zoneId] = [];
    }
    acc[position.zoneId].push({ cardId, position });
    return acc;
  }, {});

  // DndProvider sets up the drag and drop functionality
  // The two Zone components create the draw zone and player zone
  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ paddingLeft: GRID_CONFIG.HORIZONTAL_PADDING, paddingRight: GRID_CONFIG.HORIZONTAL_PADDING }} 
           className="flex flex-col items-center">
        <Zone 
          zone={ZONES.draw} 
          onDrop={handleDrop}
          cardCount={cardsByZone.draw?.length || 0}
          maxColumns={maxColumns}
        >
          {cardsByZone.draw?.map(({ cardId, position }) => (
            <DraggableYogaCard
              key={cardId}
              pose={poses[cardId]}
              position={position}
              zoneId="draw"
            />
          ))}
        </Zone>

        <Zone 
          zone={ZONES.player1} 
          onDrop={handleDrop}
          cardCount={cardsByZone.player1?.length || 0}
          maxColumns={maxColumns}
        >
          {cardsByZone.player1?.map(({ cardId, position }) => (
            <DraggableYogaCard
              key={cardId}
              pose={poses[cardId]}
              position={position}
              zoneId="player1"
            />
          ))}
        </Zone>
      </div>
    </DndProvider>
  );
};

export default YogaBoard;
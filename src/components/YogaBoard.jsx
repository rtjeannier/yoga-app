import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import YogaCard from './YogaCard';

const GRID_CONFIG = {
  CELL_WIDTH: 180,
  CELL_HEIGHT: 300,
  SPACING: 20,
  MIN_COLS: 3,
  MAX_COLS: 6,
  HORIZONTAL_PADDING: 100,
};

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

const DraggableYogaCard = ({ pose, position, zoneId }) => {
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

  const Zone = ({ zone, children, onDrop, cardCount, maxColumns }) => {

    
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
  
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'YOGA_CARD',
    drop: (item, monitor) => {
      const dropOffset = monitor.getClientOffset();
      const zoneBounds = document.getElementById(zone.id).getBoundingClientRect();
      
      const relativeX = Math.floor((dropOffset.x - zoneBounds.left) / (GRID_CONFIG.CELL_WIDTH + GRID_CONFIG.SPACING));
      const relativeY = Math.floor((dropOffset.y - zoneBounds.top) / (GRID_CONFIG.CELL_HEIGHT + GRID_CONFIG.SPACING));
      
      const x = Math.min(Math.max(0, relativeX), dimensions.cols - 1);
      const y = Math.min(Math.max(0, relativeY), dimensions.rows - 1);
      
      onDrop(item.id, { x, y }, zone.id);
      return { moved: true };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [dimensions]);

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

const YogaBoard = ({ poses }) => {
  const [maxColumns, setMaxColumns] = useState(() => {
    const availableWidth = window.innerWidth - (GRID_CONFIG.HORIZONTAL_PADDING * 2);
    const calculatedCols = Math.floor(availableWidth / (GRID_CONFIG.CELL_WIDTH + GRID_CONFIG.SPACING));
    return Math.min(
      Math.max(GRID_CONFIG.MIN_COLS, calculatedCols),
      GRID_CONFIG.MAX_COLS
    );
  });

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
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const reflowDrawZone = (positions) => {
    // Get all cards in draw zone
    const drawCards = Object.entries(positions)
      .filter(([_, pos]) => pos.zoneId === 'draw')
      .map(([cardId]) => cardId);
    
    // Calculate new dimensions based on card count
    const numCards = drawCards.length;
    const columns = Math.max(GRID_CONFIG.MIN_COLS, Math.min(maxColumns, Math.ceil(numCards / 2)));
    
    // Create new positions for all draw zone cards
    const newPositions = {};
    drawCards.forEach((cardId, index) => {
      newPositions[cardId] = {
        x: index % columns,
        y: Math.floor(index / columns),
        zoneId: 'draw'
      };
    });
    
    // Return new positions object with updated draw zone positions
    return {
      ...positions,
      ...newPositions
    };
  };

  const handleDrop = (cardId, newPosition, zoneId) => {
    setCardPositions(prev => {
      // First, check if the immediate drop position is occupied
      const cardsInZone = Object.entries(prev)
        .filter(([_, pos]) => pos.zoneId === zoneId);
      
      const isOccupied = cardsInZone.some(([_, pos]) => 
        pos.x === newPosition.x && pos.y === newPosition.y
      );

      if (isOccupied) {
        return prev;
      }

      // Create new positions with the dropped card
      const newPositions = {
        ...prev,
        [cardId]: {
          ...newPosition,
          zoneId
        }
      };

      // If this is a drop in the draw zone, reflow all cards
      if (zoneId === 'draw') {
        return reflowDrawZone(newPositions);
      }

      return newPositions;
    });
  };

  const cardsByZone = Object.entries(cardPositions).reduce((acc, [cardId, position]) => {
    if (!acc[position.zoneId]) {
      acc[position.zoneId] = [];
    }
    acc[position.zoneId].push({ cardId, position });
    return acc;
  }, {});

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ paddingLeft: GRID_CONFIG.HORIZONTAL_PADDING, paddingRight: GRID_CONFIG.HORIZONTAL_PADDING }} className="flex flex-col items-center">
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
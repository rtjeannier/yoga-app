import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import YogaCard from './YogaCard';

// Centralized grid configuration
const GRID_CONFIG = {
  // Card spacing
  CELL_WIDTH: 180,    // Width between card centers
  CELL_HEIGHT: 300,   // Height between card centers
  
  // Drop zone dimensions (slightly smaller than spacing to create gaps)
  DROPZONE_WIDTH: 260,
  DROPZONE_HEIGHT: 380,
  
  // Minimum board dimensions in cells
  MIN_COLS: 3,
  MIN_ROWS: 2,
  
  // Extra cells to add beyond the last card for dropping space
  EXTRA_CELLS: 2
};

const DraggableYogaCard = ({ pose, position, onMove }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'YOGA_CARD',
    item: { id: pose.name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div 
      ref={drag} 
      style={{
        opacity: isDragging ? 0.5 : 1,
        transform: `translate(${position.x * GRID_CONFIG.CELL_WIDTH}px, ${position.y * GRID_CONFIG.CELL_HEIGHT}px)`,
        position: 'absolute',
        cursor: 'move',
        transition: 'transform 0.3s ease-in-out'
      }}
    >
      <YogaCard {...pose} />
    </div>
  );
};

const GridCell = ({ x, y, onDrop, isVisible }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'YOGA_CARD',
    drop: (item) => onDrop(item.id, { x, y }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  if (!isVisible) return null;

  return (
    <div
      ref={drop}
      style={{
        width: GRID_CONFIG.DROPZONE_WIDTH,
        height: GRID_CONFIG.DROPZONE_HEIGHT,
        position: 'absolute',
        left: x * GRID_CONFIG.CELL_WIDTH,
        top: y * GRID_CONFIG.CELL_HEIGHT,
      }}
      className={`border-2 border-dashed rounded-lg ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
      }`}
    />
  );
};

const YogaBoard = ({ poses }) => {
  const [cardPositions, setCardPositions] = useState(() => {
    return Object.keys(poses).reduce((acc, poseName, index) => ({
      ...acc,
      [poseName]: {
        x: index,
        y: 0
      }
    }), {});
  });

  const [boardBounds, setBoardBounds] = useState({ maxX: 0, maxY: 0 });

  useEffect(() => {
    const maxX = Math.max(
      GRID_CONFIG.MIN_COLS,
      Math.max(...Object.values(cardPositions).map(pos => pos.x)) + GRID_CONFIG.EXTRA_CELLS
    );
    const maxY = Math.max(
      GRID_CONFIG.MIN_ROWS,
      Math.max(...Object.values(cardPositions).map(pos => pos.y)) + GRID_CONFIG.EXTRA_CELLS
    );
    setBoardBounds({ maxX, maxY });
  }, [cardPositions]);

  const handleDrop = (cardId, newPosition) => {
    setCardPositions(prev => ({
      ...prev,
      [cardId]: newPosition
    }));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="relative overflow-auto p-4" style={{ 
        width: '100%',
        height: '100vh',
      }}>
        <div style={{ 
          position: 'relative',
          width: `${(boardBounds.maxX + 1) * GRID_CONFIG.CELL_WIDTH}px`,
          height: `${(boardBounds.maxY + 1) * GRID_CONFIG.CELL_HEIGHT}px`,
          minWidth: `${GRID_CONFIG.MIN_COLS * GRID_CONFIG.CELL_WIDTH}px`,
          minHeight: `${GRID_CONFIG.MIN_ROWS * GRID_CONFIG.CELL_HEIGHT}px`,
        }}>
          {/* Grid cells */}
          {Array.from({ length: boardBounds.maxX * boardBounds.maxY }, (_, i) => {
            const x = i % boardBounds.maxX;
            const y = Math.floor(i / boardBounds.maxX);
            return (
              <GridCell
                key={`${x}-${y}`}
                x={x}
                y={y}
                onDrop={handleDrop}
                isVisible={true}
              />
            );
          })}

          {/* Draggable cards */}
          {Object.entries(poses).map(([poseName, pose]) => (
            <DraggableYogaCard
              key={poseName}
              pose={pose}
              position={cardPositions[poseName]}
              onMove={handleDrop}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

export default YogaBoard;
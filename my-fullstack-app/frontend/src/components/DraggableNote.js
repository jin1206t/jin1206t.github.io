// src/components/DraggableNote.js
import React from 'react';
import { useDrag } from 'react-dnd';

const DraggableNote = ({ note }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'NOTE',
    item: { note },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  console.log('isDragging:', isDragging);

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        border: '1px solid #ccc',
        borderRadius: '8px',  // Rounded corners
        padding: '16px',  // Increased padding
        marginBottom: '16px',  // Increased margin
        backgroundColor: '#fff',  // White background
        boxShadow: '0 0 5px rgba(0, 0, 0, 0.2)',  // Box shadow for depth
        transition: 'opacity 0.3s ease-in-out',  // Smooth transition
      }}
    >
      {note.content}
    </div>
  );
};

export default DraggableNote;

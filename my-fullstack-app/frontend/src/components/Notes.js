// src/components/Notes.js
import React from 'react';
import DraggableNote from './DraggableNote';

const Notes = ({ notes, onDelete }) => {
  return (
    <div>
      <h2>Notes</h2>
      {notes.map((note) => (
        <DraggableNote key={note.id} note={note} />
      ))}
      {/* ... (other code) */}
    </div>
  );
};

export default Notes;

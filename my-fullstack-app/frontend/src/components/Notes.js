// src/components/Notes.js
import React from 'react';

const Notes = ({ notes, onDelete }) => {
  return (
    <div>
      <h2>My Notes</h2>
      {notes.map((note) => (
        <div key={note.id}>
          <p>{note.content}</p>
          {/* Display other note details, including images */}
          <button onClick={() => onDelete(note.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

export default Notes;

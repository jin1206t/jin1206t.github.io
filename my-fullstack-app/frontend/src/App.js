// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css'; // Import the global CSS file
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axios from 'axios';
import MessageContent from './components/MessageContent';
import Notes from './components/Notes';
import AddNoteForm from './components/AddNoteForm';

const App = () => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    // Fetch notes from the Flask backend
    axios.get('http://localhost:5000/api/notes')
      .then((response) => setNotes(response.data))
      .catch((error) => console.error('Error fetching notes:', error));
  }, []);

  const handleAddNote = (content) => {
    // Add a new note to the backend and update the state
    axios.post('http://localhost:5000/api/notes', { content })
      .then((response) => setNotes([...notes, response.data]))
      .catch((error) => console.error('Error adding note:', error));
  };

  const handleDeleteNote = (id) => {
    // Delete a note from the backend and update the state
    axios.delete(`http://localhost:5000/api/notes/${id}`)
      .then(() => setNotes(notes.filter((note) => note.id !== id)))
      .catch((error) => console.error('Error deleting note:', error));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          {/* Left side content */}
          <MessageContent />
        </div>

        <div style={{ flex: 1, marginLeft: '20px' }}>
          {/* Right side content (Notes) */}
          <Notes notes={notes} onDelete={handleDeleteNote} />
          <AddNoteForm onAdd={handleAddNote} />
        </div>
      </div>
    </DndProvider>
  );
};

export default App;

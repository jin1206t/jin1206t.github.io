// src/App.js
import axios from 'axios';
import React, { useState } from 'react';
import Introduction from './components/Introduction';
import Notes from './components/Notes';
import AddNoteForm from './components/AddNoteForm';

const App = () => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    // Fetch notes from the Flask backend
    axios.get('http://localhost:5000/api/notes')
      .then((response) => setNotes(response.data))
      .catch((error) => console.error('Error fetching notes:', error));
  }, []);  // Empty dependency array means this effect runs once when the component mounts


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
    <div>
      <Introduction />
      <Notes notes={notes} onDelete={handleDeleteNote} />
      <AddNoteForm onAdd={handleAddNote} />
    </div>
  );
};

export default App;

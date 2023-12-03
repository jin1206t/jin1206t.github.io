// src/components/AddNoteForm.js
import React, { useState } from 'react';

const AddNoteForm = ({ onAdd }) => {
  const [content, setContent] = useState('');

  const handleAddNote = () => {
    onAdd(content);
    setContent('');
  };

  return (
    <div>
      <h2>Add a Note</h2>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      <button onClick={handleAddNote}>Add Note</button>
    </div>
  );
};

export default AddNoteForm;

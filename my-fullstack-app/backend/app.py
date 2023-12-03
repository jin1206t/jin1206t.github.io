from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Sample initial data for notes
notes = [
    {'id': 1, 'content': 'Note 1'},
    {'id': 2, 'content': 'Note 2'},
    # Add more notes as needed
]

# Endpoint to get all notes
@app.route('/api/notes', methods=['GET'])
def get_notes():
    return jsonify(notes)

# Endpoint to add a new note
@app.route('/api/notes', methods=['POST'])
def add_note():
    data = request.get_json()
    new_note = {'id': len(notes) + 1, 'content': data['content']}
    notes.append(new_note)
    return jsonify(new_note)

# Endpoint to delete a note by ID
@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    global notes
    notes = [note for note in notes if note['id'] != note_id]
    return jsonify({'message': 'Note deleted'})

if __name__ == '__main__':
    app.run(debug=True)

from flask import Flask, render_template, request, redirect, url_for, session
import json  # If not already imported
import os    # If not already imported
from werkzeug.utils import secure_filename  # If not already imported


app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static'
app.secret_key = 'your_secret_key'

notes = []

@app.route('/')
def index():
    is_authenticated = session.get('is_authenticated', False)
    return render_template('index.html', notes=notes, is_authenticated=is_authenticated)

@app.route('/add_note', methods=['POST'])
def add_note():
    is_authenticated = session.get('is_authenticated', False)
    if is_authenticated:
        note_text = request.form.get('note_text')
        note_image = request.files.get('note_image')
        notes.append({'text': note_text, 'image': note_image.filename})
        return redirect(url_for('index'))
    else:
        # Handle unauthorized attempt to add a note
        return redirect(url_for('index'))

    if note_image and note_image.filename:
        image_filename = secure_filename(note_image.filename)
        note_image.save(os.path.join(app.config['UPLOAD_FOLDER'], image_filename))
        notes.append({'text': note_text, 'image': image_filename})
    else:
        notes.append({'text': note_text, 'image': None})

    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)

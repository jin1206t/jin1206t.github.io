from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

notes = []  # Example in-memory storage for notes

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes', methods=['GET', 'POST'])
def handle_notes():
    if request.method == 'GET':
        return jsonify(notes)
    elif request.method == 'POST':
        data = request.json
        notes.append(data)
        return jsonify({'message': 'Note added successfully'})

if __name__ == '__main__':
    app.run(debug=True)

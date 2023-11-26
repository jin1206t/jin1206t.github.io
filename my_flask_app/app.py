from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Store memos as a list for simplicity (in a real app, use a database)
memos = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add_memo', methods=['POST'])
def add_memo():
    text = request.form.get('text')
    image = request.files.get('image')

    memo = {'text': text, 'image': image.filename if image else None}
    memos.append(memo)

    if image:
        image.save('static/' + image.filename)

    return jsonify({'status': 'success', 'memo': memo})

@app.route('/get_memos')
def get_memos():
    return jsonify({'memos': memos})

if __name__ == '__main__':
    app.run(debug=True)

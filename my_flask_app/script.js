async function addMemo() {
    const text = document.getElementById('memo-text').value;
    const image = document.getElementById('memo-image').files[0];

    const formData = new FormData();
    formData.append('text', text);
    formData.append('image', image);

    const response = await fetch('/add_memo', {
        method: 'POST',
        body: formData,
    });

    const result = await response.json();

    if (result.status === 'success') {
        displayMemos();
    }
}

async function displayMemos() {
    const memoContainer = document.getElementById('memo-container');
    memoContainer.innerHTML = '';

    const response = await fetch('/get_memos');
    const result = await response.json();
    const memos = result.memos;

    memos.forEach(memo => {
        const card = document.createElement('div');
        card.className = 'memo-card';
        card.draggable = true;
        card.ondragstart = (event) => {
            event.dataTransfer.setData('text/plain', JSON.stringify(memo));
        };

        const text = document.createElement('p');
        text.textContent = memo.text;
        card.appendChild(text);

        if (memo.image) {
            const image = document.createElement('img');
            image.src = `static/${memo.image}`;
            image.alt = 'Memo Image';
            card.appendChild(image);
        }

        memoContainer.appendChild(card);
    });
}

function allowDrop(event) {
    event.preventDefault();
}

function drop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData('text/plain');
    const memo = JSON.parse(data);

    // Implement logic to update the memo position in the backend
}

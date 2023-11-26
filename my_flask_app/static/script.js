document.addEventListener('DOMContentLoaded', function () {
    const memoContainer = document.getElementById('memo-container');
    const addMemoForm = document.getElementById('add-memo-form');

    // Function to create a memo card
    function createMemoCard(content, date, image) {
        const memoCard = document.createElement('div');
        memoCard.className = 'memo-card';

        const memoContent = document.createElement('p');
        memoContent.textContent = content;

        const memoDate = document.createElement('small');
        memoDate.textContent = `Date: ${date}`;

        const memoImage = document.createElement('img');
        if (image) {
            memoImage.src = URL.createObjectURL(image);
            memoImage.alt = 'Memo Image';
        }

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove Memo';
        removeButton.addEventListener('click', function () {
            memoContainer.removeChild(memoCard);
        });

        memoCard.appendChild(memoContent);
        memoCard.appendChild(memoDate);
        memoCard.appendChild(memoImage);
        memoCard.appendChild(removeButton);

        memoContainer.appendChild(memoCard);
    }

    // Event listener for form submission
    addMemoForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(addMemoForm);
        const content = formData.get('memoContent');
        const date = formData.get('memoDate');
        const image = formData.get('memoImage');

        createMemoCard(content, date, image);
        addMemoForm.reset(); // Clear form inputs
    });
});

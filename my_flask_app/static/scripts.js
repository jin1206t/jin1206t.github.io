document.addEventListener('DOMContentLoaded', function () {
    const notesContainer = document.getElementById('notes-container');
    const addNoteButton = document.getElementById('add-note-btn');

    addNoteButton.addEventListener('click', function () {
        const newNote = document.createElement('div');
        newNote.classList.add('note');
        newNote.textContent = 'Like it!'; //Default text

        // Add the note to the container
        notesContainer.appendChild(newNote);

        // Make the note draggable
        makeDraggable(newNote);
    });

    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        element.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // Adjust position within the left-side container
            const containerRect = notesContainer.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();

            const minX = 0;
            const minY = 0;
            const maxX = containerRect.width - elementRect.width;
            const maxY = containerRect.height - elementRect.height;

            let newX = element.offsetLeft - pos1;
            let newY = element.offsetTop - pos2;

            newX = Math.max(minX, Math.min(newX, maxX));
            newY = Math.max(minY, Math.min(newY, maxY));

            element.style.top = newY + "px";
            element.style.left = newX + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
});

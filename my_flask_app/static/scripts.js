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

        // Set initial position and start floating animation
        setInitialPosition(newNote);
        floatNote(newNote);
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

    function setInitialPosition(element) {
        const containerRect = notesContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        const maxX = containerRect.width - elementRect.width;
        const maxY = containerRect.height - elementRect.height;

        const initialX = Math.random() * maxX;
        const initialY = Math.random() * maxY;

        element.style.transition = 'transform 0s'; // Disable transition for initial position
        element.style.transform = `translate(${initialX}px, ${initialY}px)`;
    }


    function floatNote(element) {
        const containerRect = notesContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        const maxX = containerRect.width - elementRect.width;
        const maxY = containerRect.height - elementRect.height;

        const animationSpeed = 2; // Adjust the speed as needed

        function animate() {
            let newX = Math.random() * maxX;
            let newY = Math.random() * maxY;

            element.style.transition = `transform ${animationSpeed}s ease-in-out`;
            element.style.transform = `translate(${newX}px, ${newY}px)`;

            setTimeout(() => {
                // Reset the position after the animation
                element.style.transition = 'none';
                element.style.transform = 'none';

                // Repeat the animation after a delay
                setTimeout(animate, 1000);
            }, animationSpeed * 1000);
        }

        // Start the initial animation after a short delay to allow setting the initial position
        setTimeout(animate, 100);
    }
});

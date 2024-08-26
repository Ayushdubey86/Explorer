// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    // Get the loader element
    const loader = document.querySelector('.loader');
    const itineraryCard = document.getElementById('itinerary-card');

    // Function to hide the loader and display the content
    function displayContent(itineraryData) {
        if (itineraryCard) {
            itineraryCard.innerHTML = `<pre>${itineraryData}</pre>`;
            loader.style.display = 'none'; // Hide the loader
        } else {
            console.error('Itinerary card element not found.');
        }
    }

    // Function to handle incoming messages
    function handleIncomingMessage(event) {
        // Optionally, validate the origin of the message

        // Retrieve the data from the message
        const itineraryData = event.data;

        // Display the content
        displayContent(itineraryData);
    }

    // Add an event listener for messages from the parent window
    window.addEventListener('message', handleIncomingMessage);
});

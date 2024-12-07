

document.addEventListener('DOMContentLoaded', function () {
    // Fetch and display itineraries once DOM is loaded
    fetchAndDisplayItineraries();
});

function fetchAndDisplayItineraries() {
    alert('chk')
    fetch('/getUserEmail')
        .then(response => response.json())
        .then(data => {
            if (data.email) {
                // Fetch itineraries for the user
                fetch('/getItineraries', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: data.email })
                })
                .then(response => response.json())
                .then(itineraryData => {
                    // Select the container where the cards will be appended
                    const itineraryContainer = document.querySelector('#itinerary-container');
                    
                    // If itineraries exist, create cards for each one
                    if (itineraryData.itineraries.length > 0) {
                        // Create a Bootstrap row for the cards
                        const row = document.createElement('div');
                        row.classList.add('row', 'gx-4', 'gy-4'); // gx-4 for horizontal gutters, gy-4 for vertical spacing

                        itineraryData.itineraries.forEach((itinerary) => {
                            // Create a column for each card (responsive behavior)
                            const col = document.createElement('div');
                            col.classList.add('col-lg-3', 'col-md-6', 'col-sm-12'); // 4 columns on large, 2 on medium, 1 on small

                            // Create a card for each itinerary
                            const itineraryCard = document.createElement('div');
                            itineraryCard.classList.add('itinerary-card',  'mb-3');
                            itineraryCard.style.width = '100%'; // Full width within the column

                            itineraryCard.innerHTML = `
                                <div class="card-body">
                                    <p class="card-text">${itinerary.itinerary_data}</p>
                                </div>
                            `;

                            // Append the card to the column, and column to the row
                            col.appendChild(itineraryCard);
                            row.appendChild(col);
                        });

                        // Append the row to the container
                        itineraryContainer.appendChild(row);
                    } else {
                        // If no itineraries are found, display a message in the container
                        itineraryContainer.innerHTML = '<p>No itinerary data found.</p>';
                    }
                })
                .catch(error => console.error('Error fetching itineraries:', error));
            } else {
                console.error('No email found in session.');
            }
        })
        .catch(error => console.error('Error fetching user email:', error));
}

// window.onload = function() {
//     // First, fetch the user email from the session
//     fetch('/getUserEmail')
//         .then(response => response.json())
//         .then(data => {
//             if (data.email) {
//                 alert('chek')
//                 // Once we have the email, fetch itineraries for that email
//                 fetch('/getItineraries', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify({ email: data.email })
//                 })
//                 .then(response => response.json())
//                 .then(itineraryData => {
//                     if (itineraryData.itineraries && itineraryData.itineraries.length > 0) {
//                         // Iterate over all itineraries and log them to the console
//                         console.log('Fetched Itineraries:', itineraryData.itineraries);
                        
//                         // Display itineraries on the page
//                         const itineraryContent = document.getElementById('itinerary-content');
//                         itineraryContent.innerHTML = ''; // Clear existing content
                        
//                         itineraryData.itineraries.forEach((itinerary, index) => {
//                             const itineraryElement = document.createElement('div');
//                             itineraryElement.classList.add('itinerary-item');
//                             itineraryElement.innerHTML = `
//                                 <h3>Itinerary #${index + 1}</h3>
//                                 <p>${itinerary.itinerary_data}</p>
//                             `;
//                             itineraryContent.appendChild(itineraryElement);
//                         });
//                     } else {
//                         console.log('No itineraries found for this user.');
//                         document.getElementById('itinerary-content').innerHTML = 'No itinerary data found.';
//                     }
//                 })
//                 .catch(error => {
//                     console.error('Error fetching itineraries:', error);
//                 });
//             } else {
//                 console.error('No email found in session.');
//                 document.getElementById('itinerary-content').innerHTML = 'No user email found in session.';
//             }
//         })
//         .catch(error => {
//             console.error('Error fetching user email:', error);
//         });
// };


window.onload = function() {
    // First, fetch the user email from the session
    alert('chk');
    fetch('/getUserEmail')
        .then(response => response.json())
        .then(data => {
            if (data.email) {
                alert('chek');
                // Once we have the email, fetch itineraries for that email
                fetch('/getItineraries', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: data.email })
                })
                .then(response => response.json())
                .then(itineraryData => {
                    if (itineraryData.itineraries && itineraryData.itineraries.length > 0) {
                        // Iterate over all itineraries and log them to the console
                        console.log('Fetched Itineraries:', itineraryData.itineraries);
                        
                        // Display itineraries on the page
                        const itineraryContainer = document.getElementById('itinerary-container');
                        itineraryContainer.innerHTML = ''; // Clear existing content
                        
                        itineraryData.itineraries.forEach((itinerary, index) => {
                            // Create a card for each itinerary
                            const itineraryCard = document.createElement('div');
                            itineraryCard.classList.add('itinerary-card');
                            
                            itineraryCard.innerHTML = `
                                <img src="trolltunga_expl.png" alt="Itinerary Image">
                                <p>${itinerary.itinerary_data}</p>
                            `;
                            
                            // Append the card to the container
                            itineraryContainer.appendChild(itineraryCard);
                        });
                    } else {
                        console.log('No itineraries found for this user.');
                        document.getElementById('itinerary-container').innerHTML = 'No itinerary data found.';
                    }
                })
                .catch(error => {
                    console.error('Error fetching itineraries:', error);
                });
            } else {
                console.error('No email found in session.');
                document.getElementById('itinerary-container').innerHTML = 'No user email found in session.';
            }
        })
        .catch(error => {
            console.error('Error fetching user email:', error);
        });
};



window.addEventListener('load', function() {
 
    const email = localStorage.getItem('emailLog') || null; // Null if not found

      
    const userTripId = null;
    // fetch('/getUserTripId')
    //     .then(response => response.json())
    //     .then(data => {
          
    //         userTripId = data.userTripId;
          
    //     })
    //     .catch(error => {
    //         console.error('Error fetching userTripId:', error);
    //     });

    // // Poll for the itineraryResponse in localStorage
    // console.log('userTripId',userTripId);
    const itineraryCard = document.getElementById('itinerary-card');
    const itineraryTitle = document.getElementById('itinerary-title');
    const itineraryContent = document.getElementById('itinerary-content');

    const checkForItinerary = setInterval(() => {
    const itineraryResponse = localStorage.getItem('itineraryResponse');
    
    if (itineraryResponse) {
        const parsedResponse = JSON.parse(itineraryResponse);

        if (parsedResponse.status === 'success') {
            // Display the itinerary data
            itineraryContent.textContent = parsedResponse.data;

            // Show the title and hide the loading shimmer
            itineraryTitle.style.display = 'block'; // Show the title
            itineraryCard.classList.remove('is-loading'); // Remove the shimmer

            // Stop checking after data is displayed
            clearInterval(checkForItinerary);

            // Send the itinerary data to the server if email and userTripId are available

            if (email ) {                
                const itineraryData = parsedResponse.data;

                fetch('/storeItineraryData', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, itineraryData }),
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        console.log('Itinerary stored successfull');
                    } else {
                        console.error('Error storing itinerary data');
                    }
                })
                .catch(error => {
                    console.error('Error storing itinerary:', error);
                });
            } else {
                console.log('No email or userTripId available, skipping itinerary storage.');
            }

        } else if (parsedResponse.status === 'error') {
            itineraryContent.textContent = parsedResponse.message;
            clearInterval(checkForItinerary); // Stop checking after error is displayed
        }
    }
}, 500);
});



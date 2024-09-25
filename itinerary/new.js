// // Wait for the DOM to fully load
// document.addEventListener('DOMContentLoaded', () => {
//     // Get the loader element
//     const loader = document.querySelector('.loader');
//     const itineraryCard = document.getElementById('itinerary-card');

//     // Function to hide the loader and display the content
//     function displayContent(itineraryData) {
//         if (itineraryCard) {
//             itineraryCard.innerHTML = `<pre>${itineraryData}</pre>`;
//             loader.style.display = 'none'; // Hide the loader
//         } else {
//             console.error('Itinerary card element not found.');
//         }
//     }

//     // Function to handle incoming messages
//     function handleIncomingMessage(event) {
//         // Optionally, validate the origin of the message

//         // Retrieve the data from the message
//         const itineraryData = event.data;

//         // Display the content
//         displayContent(itineraryData);
//     }

//     // Add an event listener for messages from the parent window
//     window.addEventListener('message', handleIncomingMessage);
// });

// window.addEventListener('load', function() {
//     const itineraryContent = document.getElementById('itinerary-content');
    
//     // Retrieve the AI response from localStorage
//     const itineraryResponse = localStorage.getItem('itineraryResponse');

//     if (itineraryResponse) {
//         // Display the AI response on the page
//         itineraryContent.textContent = itineraryResponse;
//     } else {
//         itineraryContent.textContent = "No itinerary data found.";
//     }
// });


// -----------------------

// window.addEventListener('load', function() {
//     const itineraryContent = document.getElementById('itinerary-content');
    
//     // Display a loading message initially
//     itineraryContent.textContent = "Loading your itinerary, please wait...";

//     // Poll for the itineraryResponse in localStorage
//     const checkForItinerary = setInterval(() => {
//         const itineraryResponse = localStorage.getItem('itineraryResponse');
//         if (itineraryResponse) {
//             const parsedResponse = JSON.parse(itineraryResponse);

//             if (parsedResponse.status === 'success') {
//                 itineraryContent.textContent = parsedResponse.data;
//                 clearInterval(checkForItinerary); // Stop checking after data is displayed
//             } else if (parsedResponse.status === 'error') {
//                 itineraryContent.textContent = parsedResponse.message;
//                 clearInterval(checkForItinerary); // Stop checking after error is displayed
//             }
//         }
//     }, 500); // Check every 500ms for the data
// });


//---------------------------

//const userTripId = window.userTripId;
//const userTripId = localStorage.getItem('userTripId');


//-----------------------------

// window.addEventListener('load', function() {
//     const itineraryContent = document.getElementById('itinerary-content');

//     // Display a loading message initially
//     itineraryContent.textContent = "Loading your itinerary, please wait...";

//     // Get the user's email from localStorage (retrieved after login)
//     const email = localStorage.getItem('emailLog') || null; // Null if not found
//     //const email = localStorage.getItem('emailLog') || null; // Null if not found
//     const userTripId = localStorage.getItem('userTripId');


//     // Poll for the itineraryResponse in localStorage
//     const checkForItinerary = setInterval(() => {
//         const itineraryResponse = localStorage.getItem('itineraryResponse');
//         if (itineraryResponse) {
//             const parsedResponse = JSON.parse(itineraryResponse);

//             if (parsedResponse.status === 'success') {
//                 // Display the itinerary data
//                 itineraryContent.textContent = parsedResponse.data;
//                 console.log("check 2 :",userTripId);

//                 // Stop checking after data is displayed
//                 clearInterval(checkForItinerary);

//                 // Send the itinerary data to the server if email is available
//                 if (email) {
//                     const itineraryData = parsedResponse.data;

//                     fetch('/storeItineraryData', {
//                         method: 'POST',
//                         headers: {
//                             'Content-Type': 'application/json',
//                         },
//                         body: JSON.stringify({ userTripId, itineraryData }),
//                     })
//                     .then(response => response.json())
//                     .then(data => {
//                         if (data.message) {
//                             console.log('Itinerary stored successfully:', data.message);
//                         } else {
//                             console.log('Error storing itinerary data');
//                         }
//                     })
//                     .catch(error => {
//                         console.error('Error storing itinerary:', error);
//                     });
//                 } else {
//                     console.log('No email available, skipping itinerary storage.');
//                 }

//             } else if (parsedResponse.status === 'error') {
//                 itineraryContent.textContent = parsedResponse.message;
//                 clearInterval(checkForItinerary); // Stop checking after error is displayed
//             }
//         }
//     }, 500); // Check every 500ms for the data
// });


window.addEventListener('load', function() {
 //   const itineraryContent = document.getElementById('itinerary-content');

    // Display a loading message initially
 //   itineraryContent.textContent = "Loading your itinerary, please wait...";

    // Get the user's email from localStorage (retrieved after login)
    const email = localStorage.getItem('emailLog') || null; // Null if not found

    // Fetch the userTripId from the session
  
    let userTripId = null;
    fetch('/getUserTripId')
        .then(response => response.json())
        .then(data => {
            if (data.userTripId) {
                userTripId = data.userTripId;
                console.log('UserTripId retrieved:', userTripId);
            } else {
                console.error('No userTripId found in session');
            }
        })
        .catch(error => {
            console.error('Error fetching userTripId:', error);
        });

    // Poll for the itineraryResponse in localStorage
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
            if (email && userTripId) {
                const itineraryData = parsedResponse.data;

                fetch('/storeItineraryData', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userTripId,email, itineraryData }),
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        console.log('Itinerary stored successfully:', data.message);
                    } else {
                        console.log('Error storing itinerary data');
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


// const itineraryCard = document.getElementById('itinerary-card');
// const itineraryTitle = document.getElementById('itinerary-title');
// const itineraryContent = document.getElementById('itinerary-content');

// const checkForItinerary = setInterval(() => {
//     const itineraryResponse = localStorage.getItem('itineraryResponse');
    
//     if (itineraryResponse) {
//         const parsedResponse = JSON.parse(itineraryResponse);

//         if (parsedResponse.status === 'success') {
//             // Display the itinerary data
//             itineraryContent.textContent = parsedResponse.data;

//             // Show the title and hide the loading shimmer
//             itineraryTitle.style.display = 'block'; // Show the title
//             itineraryCard.classList.remove('is-loading'); // Remove the shimmer

//             // Stop checking after data is displayed
//             clearInterval(checkForItinerary);

//             // Send the itinerary data to the server if email and userTripId are available
//             if (email && userTripId) {
//                 const itineraryData = parsedResponse.data;

//                 fetch('/storeItineraryData', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify({ userTripId, itineraryData }),
//                 })
//                 .then(response => response.json())
//                 .then(data => {
//                     if (data.message) {
//                         console.log('Itinerary stored successfully:', data.message);
//                     } else {
//                         console.log('Error storing itinerary data');
//                     }
//                 })
//                 .catch(error => {
//                     console.error('Error storing itinerary:', error);
//                 });
//             } else {
//                 console.log('No email or userTripId available, skipping itinerary storage.');
//             }

//         } else if (parsedResponse.status === 'error') {
//             itineraryContent.textContent = parsedResponse.message;
//             clearInterval(checkForItinerary); // Stop checking after error is displayed
//         }
//     }
// }, 500);

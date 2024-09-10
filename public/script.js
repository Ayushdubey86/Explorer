// Function to check if the user has already searched
function checkSearchLimit() {
    // Check if the user is logged in
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn) {
        return true; // Allow search if logged in
    }

    const hasSearched = localStorage.getItem('hasSearched');
    if (hasSearched) {
        console.log('Please login/register to use more');
        return false;
    }

    localStorage.setItem('hasSearched', 'true'); // Mark as searched
    return true;
}


// Trigger the search functionality when "Plan My Trip" button is clicked
// document.getElementById('submit-button').addEventListener('click', async function () {
//     // Check search limit before proceeding
//     if (!checkSearchLimit()) {
//         return; // Prevent further searches without login/registration
//     }

//     const newWindow = window.open('/itinerary', '_blank'); 

//     if (!newWindow) {
//         console.error("Failed to open new window. It may have been blocked by a popup blocker.");
//         return; 
//     }

//     const residentvar = document.getElementById('resident').value || 'anywhere in the world';
//     const expenseCap = parseFloat(document.getElementById('expense-cap').value) || 10000;
//     const currency = document.getElementById('currency').value || 'USD';
//     const duration = document.getElementById('duration').value || 'not specified';
//     const companion = document.getElementById('companion').value || 'Alone';
//     const accommodation = document.getElementById('accommodation').value || 'not specified';
//     const style = document.getElementById('style').value || 'not specified';
//     const interest = document.getElementById('interest').value || 'not specified';
//     const transport = document.getElementById('transport').value || 'not specified';

//     // Fetch itinerary
//     try {
//         const response = await fetch('http://localhost:3001/openai', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ prompt: prompt })
//         });

//         const data = await response.json();

//         // Send itinerary data to the new window
//         if (newWindow) {
//             newWindow.postMessage(data.response, '*');
//         }
//     } catch (error) {
//         console.error('Error fetching the itinerary:', error);
//         if (newWindow) {
//             newWindow.close(); 
//         }
//     }

//     console.log({ expenseCap, currency, duration, companion, accommodation, style, interest, transport });
// });

document.getElementById('submit-button').addEventListener('click', async function () {
    if (!checkSearchLimit()) {
        return; // Prevent further searches without login/registration
    }

    const newWindow = window.open('/itinerary', '_blank'); 

    if (!newWindow) {
        console.error("Failed to open new window. It may have been blocked by a popup blocker.");
        return; 
    }

    const residentvar = document.getElementById('resident').value || 'anywhere in the world';
    const expenseCap = document.getElementById('expense-cap').value || '1000';
    const currency = document.getElementById('currency').value || 'USD';
    const duration = document.getElementById('duration').value || 'not specified';
    const companion = document.getElementById('companion').value || 'Alone';
    const accommodation = document.getElementById('accommodation').value || 'not specified';
    const style = document.getElementById('style').value || 'not specified';
    const interest = document.getElementById('interest').value || 'not specified';
    const transport = document.getElementById('transport').value || 'not specified';

  // Base prompt creation function
  function createBasePrompt() {
    let baseText = '';

    if (residentvar !== 'anywhere in the world') {
        baseText += `I am a resident of ${residentvar}. `;
    }

    if (expenseCap !== 10000 || currency !== 'USD') {
        baseText += `I have a budget of ${expenseCap} ${currency}. `;
    }

    if (duration !== 'not specified') {
        baseText += `The trip will last ${duration} days. `;
    }

    baseText += `Could you give me an itinerary that I can explore, which can be anywhere in the world or near ${residentvar}? I would appreciate it if you could include both hidden gems and famous places in the itinerary.`;

    baseText += ` Please include detailed travel plans, such as "Day 1: hometown to location, you can see this, stay in a hotel/hostel [name], Day 2: breakfast, travel to hike mountain, great view...etc.", with hostel stays priced around $15. At the end of the trip, I would like to return home with all expenses included.`;

    baseText += ` Also, please suggest local or famous cuisines I could try at each place. At the end, kindly provide a breakdown of all expenses, e.g., transportation $300, food $50, local sightseeing $50, etc. Please ensure that each day includes detailed accommodation suggestions, including hostel/hotel names and prices. Transportation doesn't have to be by flight; road travel is fine too.`;

    return baseText;
}

// Custom prompt creation function
function customPrompt() {
    let customText = `I am a resident of ${residentvar}. I have a budget of ${expenseCap} ${currency} for a trip lasting ${duration} days.`;
    
    if (companion !== 'Alone') {
        customText += ` I will be traveling with ${companion}.`;
    }

    if (accommodation !== 'not specified') {
        customText += ` I would prefer staying in ${accommodation} accommodations.`;
    }

    if (style !== 'not specified') {
        customText += ` My preferred travel style is ${style}.`;
    }

    if (interest !== 'not specified') {
        customText += ` I am particularly interested in ${interest}.`;
    }

    if (transport !== 'not specified') {
        customText += ` I prefer to travel by ${transport}.`;
    }

    customText += ` Could you create an itinerary that includes both hidden gems and famous places, with detailed travel and accommodation suggestions, including hostel/hotel names and prices? Please also include local or famous cuisine suggestions for each location, and a breakdown of all expenses.`;

    return customText;
}

// Decide between base or custom prompt
  let prompt = (companion !== 'Alone' || accommodation !== 'not specified' || style !== 'not specified' || interest !== 'not specified' || transport !== 'not specified') ? customPrompt() : createBasePrompt();

    try {
        // Fetch itinerary without storing data if user is not logged in
        const response = await fetch('http://localhost:3001/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();

        // If user is logged in, store their search data
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        const email = sessionStorage.getItem('emailLog');

        console.log(isLoggedIn);
        console.log(email);
        

        if (isLoggedIn && email) {
            await fetch('/storeTripData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    currency,
                    expenseCap,
                    residentvar,
                    duration,
                    companion,
                    accommodation,
                    style,
                    interest,
                    transport
                })
            });
        }

        // Handle itinerary display logic here

    } catch (error) {
        console.error('Error fetching the itinerary:', error);
    }
});



document.querySelector('.inline-container h1').addEventListener('click', function() {
    const optionalInfo = document.getElementById('optional-info');
    optionalInfo.classList.toggle('active');
});

document.addEventListener('DOMContentLoaded', () => {
    const headers = document.querySelectorAll('.accordion-header');

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isOpen = content.style.display === 'block';

            document.querySelectorAll('.accordion-content').forEach(c => c.style.display = 'none');

            if (!isOpen) {
                content.style.display = 'block';
            }
        });
    });
});

let isPopupOpen = false;

function openLoginPopup() {
    document.getElementById("loginPopup").style.display = "block";
    isPopupOpen = true;
}

function closeLoginPopup() {
    document.getElementById("loginPopup").style.display = "none"; // Corrected ID
    isPopupOpen = false;
}

window.onclick = function(event) {
    var popup = document.getElementById("loginPopup");
    if (event.target == popup) {
        popup.style.display = "none";
        isPopupOpen = false;
    }
}

let popupReg = false;

function openRegisterPopup() {
    document.getElementById("RegisterPopup").style.display = "block";
    
    popupReg = true;
}

function closeRegPopup() {
    document.getElementById("RegisterPopup").style.display = "none"; // Corrected ID
    popupReg = false;
}

window.onclick = function(event) {
    var popup = document.getElementById("RegisterPopup");
    if (event.target == popup) {
        popup.style.display = "none";
        popupReg = false;
    }
 }

const videoSources = [
    'images/alps speed.mp4',
    'images/shark swimy.mp4'
];

const overlayTexts = [
    "Take a step beyond with us",
    "Join Us. Live with us."
];

let videoIndex = 0;
const videoElement = document.getElementById('background-video');
const overlayTextElement = document.querySelector('.overlay-text');

function fadeOutVideo(videoElement, callback) {
    videoElement.style.transition = 'opacity 1s ease-out';
    videoElement.style.opacity = 0;
    setTimeout(callback, 1000); // Wait for the fade-out transition to finish
}

function fadeInVideo(videoElement) {
    videoElement.style.transition = 'opacity 1s ease-in';
    videoElement.style.opacity = 1;
}

function loadNextVideo() {
    fadeOutVideo(videoElement, () => {
        videoElement.src = videoSources[videoIndex];
        videoElement.play();
        fadeInVideo(videoElement);

        // Update the overlay text for the current video
        overlayTextElement.textContent = overlayTexts[videoIndex];
        overlayTextElement.style.display = overlayTexts[videoIndex] ? 'block' : 'none';

        videoIndex = (videoIndex + 1) % videoSources.length;
    });
}

// Load the first video
loadNextVideo();

// Event listener to load the next video when the current one ends
videoElement.addEventListener('ended', loadNextVideo);


// script.js
document.getElementById('registerButton').addEventListener('click', () => {
    const email = document.getElementById('emailReg').value;
    const password = document.getElementById('passwordReg').value;

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'OTP sent to email') {
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('otpForm').style.display = 'block';
        }
        document.getElementById('message').innerText = data.message;
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// Login
document.getElementById('submit-login').addEventListener('click', () => {
    const email = document.getElementById('emailLog').value;
    console.log('email in login ', email);
    
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Login successful') {
            console.log('Login successful');
            closeLoginPopup();
            document.querySelector('.login-button').style.display = 'none'; // Hide the login btn
            document.querySelector('.Register-button').style.display = 'none'; // Hide the Register button

            // Set session storage to allow searches
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('emailLog', email);
            // Optionally redirect or perform another action
        } else {
            console.log('Wrong email/password');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});


document.getElementById('verifyOtpButton').addEventListener('click', () => {
    const email = document.getElementById('emailReg').value;
    const otp = document.getElementById('otp').value;
    const password = document.getElementById('passwordReg').value;
    console.log(password);
    

    fetch('/verify-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp,password }),
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('message').innerText = data.message;
        if (data.message === 'OTP verified and user registered successfully') {
            closeRegPopup(); // Close the registration popup
            document.querySelector('.Register-button').style.display = 'none'; // Hide the Register button
            document.querySelector('.login-button').style.display = 'none'; // Hide the login btn
       }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

function hasGreatBudget(expenseCap, currency) {
    const budgetInUSD = (currency === 'USD') ? expenseCap : convertCurrencyToUSD(expenseCap, currency);
    return budgetInUSD > 10000;
}

function convertCurrencyToUSD(amount, currency) {
    const conversionRates = {
        'EUR': 1.1,
        'INR': 0.012,
        'GBP': 1.322,
        'JPY': 0.069

    };
    return amount * (conversionRates[currency] || 1);
}

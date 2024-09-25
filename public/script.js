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

document.getElementById('submit-button').addEventListener('click', async function () {
    if (!checkSearchLimit()) {
        return; // Prevent further searches without login/registration
    }

    const newWindow = window.open('/itinerary', '_blank'); 

    if (!newWindow) {
        console.error("Failed to open new window. It may have been blocked by a popup blocker.");
        return; 
    }

    localStorage.setItem('itineraryResponse', JSON.stringify({ status: 'loading' }));

    const travelto = document.getElementById('location').value || 'anywhere in the world';
    const residentvar = document.getElementById('resident').value || 'anywhere in the world';
    const expenseCap = document.getElementById('expense-cap').value || '0';
    const currency = document.getElementById('currency').value || 'USD';
    const duration = document.getElementById('duration').value || 'not specified';
    const companion = document.getElementById('companion').value || 'Alone';
    const accommodation = document.getElementById('accommodation').value || 'not specified';
    const style = document.getElementById('style').value || 'not specified';
    const interest = document.getElementById('interest').value || 'not specified';
    const transport = document.getElementById('transport').value || 'not specified';

    // Base prompt creation function
    function createBasePrompt() {
        let baseText = `Could you please give me an itinerary for these fields.`;

        if (travelto !== 'anywhere in the world') {
            baseText += ` I want to travel to ${travelto}.`;
        } else {
            baseText += ` Anywhere to travel in the world, can be next to home city, or another hemisphere. Please decide this based on the budget.`;
        }

        if (residentvar !== 'anywhere in the world') {
            baseText += ` I am a resident of ${residentvar}. `;
        }
   
        

        if (expenseCap !== '10000' || currency !== 'USD') {
            baseText += ` I have a budget of ${expenseCap} ${currency}. `;
        }

        if (duration !== 'not specified') {
            baseText += ` The trip will last ${duration} days. `;
        }

        if (companion !== 'Alone') {
            if (companion === 'Solo') {
                baseText += ` I will be traveling solo.`;
            }
            if (companion === 'Couple') {
                baseText += ` I will be traveling with another person, please include places that are couple-friendly and adjust the budget accordingly.`;
            }
            if (companion === 'Family') {
                baseText += ` I will be traveling with family, please include family-friendly places and adjust the budget accordingly.`;
            }
            if (companion === 'Group') {
                baseText += ` I will be traveling with a group, please include places accessible to groups and adjust the budget accordingly.`;
            }
        }

        if (accommodation !== 'not specified') {
            if (accommodation === 'Hotel') {
                baseText += ` I would prefer staying in hotels, please suggest hotels for staying.`;
            }
            if (accommodation === 'Hostel') {
                baseText += ` I would prefer staying in hostels, please suggest hostels.`;
            }
            if (accommodation === 'Vacation Rental') {
                baseText += ` I would prefer staying in a vacation rental, please suggest this kind of accommodation.`;
            }
            if (accommodation === 'Camping') {
                baseText += ` I would prefer camping for my accommodation, please suggest camping areas.`;
            }
        }

        if (style !== 'not specified') {
            if (style === 'Adventure') {
                baseText += ` Please include adventure sports like Downhill Skateboarding, Cave Diving, Speed Flying, Bungee Jumping, Via Ferrata, Megavalanche, Wingsuit Flying, Heli-Skiing, Whitewater Rafting, and Ice Climbing if possible.`;
            }
            if (style === 'Relaxation') {
                baseText += ` Please include relaxation activities like yoga, serene peaceful beaches, zen gardens, and spa treatments.`;
            }
            if (style === 'Cultural') {
                baseText += ` Please include cultural activities such as Tibetan monasteries, Byzantine religious traditions, etc.`;
            }
        }

        if (interest !== 'not specified') {
            if (interest === 'Historical Sites') {
                baseText += ` Please include UN historical sites in the city or country.`;
            }
            if (interest === 'Nature and Hiking') {
                baseText += ` Please include nature spots and hiking trails in the itinerary.`;
            }
            if (interest === 'Food and Wine') {
                baseText += ` Please include places where I can enjoy food and fine wine.`;
            }
            if (interest === 'Art and Culture') {
                baseText += ` Please include arts and culture places in the city or country.`;
            }
            if (interest === 'Shopping') {
                baseText += ` Please include shopping spots, including antiques, clothes, and paintings.`;
            }
        }

        if (transport !== 'not specified') {
            if (transport === 'Car Rental') {
                baseText += ` Please include car rental transportation between cities if possible.`;
            }
            if (transport === 'Public Transport') {
                baseText += ` Please include public transportation within and between cities if possible.`;
            }
            if (transport === 'Walking/Biking') {
                baseText += ` Please include walking or biking transportation within the city.`;
            }
        }

        baseText += ` Please include detailed travel plans, such as "Day 1: travel from hometown to destination, stay in a hotel, etc.", with hostel stays priced around $15. At the end of the trip, I would like to return home with all expenses included. Prompt should be around 3000 characters.`;

        console.log(baseText);
        return baseText;
    }

    // Generate the prompt text
    const prompt = createBasePrompt();
    const secretKey = 'fcvatgf76wyge8rwefhrgfveivsw8e97w@$?.woehnafc';  // Make sure to use a secure key that is not exposed

    try {

        const encryptedPrompt = CryptoJS.AES.encrypt(JSON.stringify(prompt), secretKey).toString();
    
    
        // Fetch itinerary without storing data if user is not logged in
        const response = await fetch('http://localhost:3001/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: encryptedPrompt }) // Use the prompt generated from createBasePrompt
        });

        const data = await response.json();

        const itineraryResponse = data.response;

        // Store the response in localStorage
        localStorage.setItem('itineraryResponse', JSON.stringify({ status: 'success', data: itineraryResponse }));

        // If user is logged in, store their search data
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        const email = localStorage.getItem('emailLog');

        console.log(isLoggedIn);
        console.log(email);

        if (isLoggedIn && email) {
            await fetch('/storeTripData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    travelto,
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
    
    'images/lofoten cliff.mp4',
    //'images/shark swimy.mp4'
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
// document.getElementById('submit-login').addEventListener('click', () => {
//     const email = document.getElementById('emailLog').value;
//     console.log('email in login ', email);
    
//     const password = document.getElementById('password').value;

//     fetch('/login', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ email, password }),
//     })
//     .then(response => response.json())
//     .then(data => {
//         if (data.message === 'Login successful') {
//             console.log('Login successful');
//             closeLoginPopup();
//             document.querySelector('.login-button').style.display = 'none'; // Hide the login btn
//             document.querySelector('.Register-button').style.display = 'none'; // Hide the Register button

//             // Set session storage to allow searches
//             sessionStorage.setItem('isLoggedIn', 'true');
//             localStorage.setItem('emailLog', email);
//             // Optionally redirect or perform another action
//         } else {
//             console.log('Wrong email/password');
//         }
//     })
//     .catch(error => {
//         console.error('Error:', error);
//     });
// });

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

// function setCookie(name, value, days) {
//     const date = new Date();
//     date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); // Set the cookie expiration in days
//     const expires = "expires=" + date.toUTCString();
//     document.cookie = name + "=" + value + ";" + expires + ";path=/"; // Set the cookie for the entire site
// }


// Login
document.getElementById('submit-login').addEventListener('click', () => {
    const email = document.getElementById('emailLog').value;
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
            document.querySelector('.login-button').style.display = 'none'; // Hide the login button
            document.querySelector('.Register-button').style.display = 'none'; // Hide the Register button

            // Set session storage to allow searches
            sessionStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('emailLog', email);

            // Check for previous itinerary after successful login
            checkForPreviousItinerary(email);
        } else {
            console.log('Wrong email/password');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

function checkForPreviousItinerary(email) {
    fetch('/checkItinerary', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.hasItinerary) {
            // Show the "Previous Itinerary" button if user has itinerary data
            document.querySelector('.prev-iti').style.display = 'block';
        } else {
            // Hide the button if no itinerary exists (optional, in case hidden by default)
            document.querySelector('.prev-iti').style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error checking itinerary:', error);
    });
}


document.querySelector('.prev-iti button').addEventListener('click', () => {
    const newWindow2 = window.open('/histprompt', '_blank'); 

    if (!newWindow2) {
        console.error("Failed to open new window. It may have been blocked by a popup blocker.");
        return; 
    }
})


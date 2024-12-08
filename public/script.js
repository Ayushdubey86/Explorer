document.addEventListener('DOMContentLoaded', function () {

    mailcheck();

    checkLoginStatus(); // Check login status after DOM is ready
 
});

let encryptionKey = null; // Will hold the fetched key
let encryptTrip = null;

// Get email from localStorage and send it to the backend
async function mailcheck() {
    const email = localStorage.getItem('emailLog'); // Get email from localStorage

    if (email) {
        try {
            const response = await fetch('/passOn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }), // Send email in body
            });

            if (response.ok) {
                console.log('Email sent to backend successfully');
            } else {
                console.error('Failed to pass email to backend');
            }
        } catch (error) {
            console.error('Failed to get email:', error);
        }
    } else {
        console.log('OOps');
    }
}


// Function to fetch the encryption key from your server


const videoSources = [
  
    'videos/lofoten cliff.mp4',
    'videos/zambiaBridge.mp4',
    'videos/maderia sea.mp4',
    'videos/drone river.mp4',
    'videos/venezia.mp4',  
    'videos/cylceland.mp4',
    'videos/zambiaBridge.mp4',
    'videos/maderia sea.mp4'
    //'images/shark swimy.mp4'
];

const overlayTexts = [
    "The World is Waiting—Dive in! Your Adventure Starts Today, not Tomorrow",
    "Take the Leap, Chase the Horizon, and write your story on Every Continent",
    "Your Journey Starts the Moment you Decide. Break Free—Travel, Live, Explore",
    "This is your Sign. The Time is Now. Pack your Bags and live the Adventure!",
    "Don’t just Dream of Faraway Lands—Make Them your Reality. The Time is now!",
    "Go Beyond Borders, Beyond Limits—Choose the Red Pill, and never Look Back",
    "One Life. One Chance. Choose the Adventure of a Lifetime. Go Now",
    "Leave the ordinary behind. The world is calling—answer it today"
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

// Function to check if the user has already searched

function checkSearchLimit() {
    // Check if the user is logged in using cookies instead of sessionStorage
    const isLoggedIn = getCookie('isLoggedIn');
    if (isLoggedIn === 'true') {
        return true; // Allow search if logged in
    }

    // Get encrypted 'hasSearched' from cookies instead of localStorage
    const encryptedHasSearched = getCookie('hasSearched');
    if (encryptedHasSearched) {
        const hasSearched = decryptData(encryptedHasSearched);
        if (hasSearched === 'true') {
            showModal();
            return false;
        }
    }

    // Encrypt and store the 'hasSearched' value in a cookie
    const encryptedValue = encryptData('true');
    setCookie('hasSearched', encryptedValue, 3); // Store encrypted value for 3 days

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
    const residentvar = document.getElementById('resident').value || 'Assume India';
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

        return baseText;
    }

    // Generate the prompt text
    const prompt = createBasePrompt();
    const secretKey = 'fcvatgf76wyge8rwefhrgfveivsw8e97w@$?.=1-043248029834279562945.,/skxcknlcwoehnafc';  // Make sure to use a secure key that is not exposed

    try {

        // const encryptedPrompt = CryptoJS.AES.encrypt(JSON.stringify(prompt), secretKey).toString();
    
        //const { encryptedPrompt} = await simpleEncrypt(prompt);

        // Fetch itinerary without storing data if user is not logged in
        const response = await fetch('/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ encryptedPrompt: prompt }) // Use the prompt generated from createBasePrompt
        });

        const data = await response.json();

        const itineraryResponse = data.response;

        // Store the response in localStorage
        localStorage.setItem('itineraryResponse', JSON.stringify({ status: 'success', data: itineraryResponse }));

        // If user is logged in, store their search data
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        const email = localStorage.getItem('emailLog');

        if (email) {
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

document.getElementById('submit-button-mobile').addEventListener('click', async function () {
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
    const residentvar = document.getElementById('resident').value || 'Assume India';
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

        return baseText;
    }

    // Generate the prompt text
    const prompt = createBasePrompt();
    const secretKey = 'fcvatgf76wyge8rwefhrgfveivsw8e97w@$?.=1-043248029834279562945.,/skxcknlcwoehnafc';  // Make sure to use a secure key that is not exposed

    try {

        // const encryptedPrompt = CryptoJS.AES.encrypt(JSON.stringify(prompt), secretKey).toString();
    
        //const { encryptedPrompt} = await simpleEncrypt(prompt);

        // Fetch itinerary without storing data if user is not logged in
        const response = await fetch('/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ encryptedPrompt: prompt}) // Use the prompt generated from createBasePrompt
        });

        const data = await response.json();

        const itineraryResponse = data.response;

        // Store the response in localStorage
        localStorage.setItem('itineraryResponse', JSON.stringify({ status: 'success', data: itineraryResponse }));

        // If user is logged in, store their search data
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        const email = localStorage.getItem('emailLog');

        if (email) {
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
    document.getElementById("loginPopup").style.display = "none"; 
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
    document.getElementById('loginPopup').style.display = 'none'; 
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



// script.js
document.getElementById('registerButton').addEventListener('click', () => {
    const email = document.getElementById('emailReg').value;
    const password = document.getElementById('passwordReg').value;
    const messageElement = document.getElementById('message');
    
    // Clear any previous messages
    messageElement.innerText = '';

    // Email validation function
    function isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    // Password validation (minimum 6 characters)
    function isStrongPassword(password) {
        return password.length >= 6;
    }

    // Validate email
    if (!isValidEmail(email)) {
        messageElement.innerText = 'Please enter a valid email address';
        return; // Stop further execution if email is invalid
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
        messageElement.innerText = 'Password must be at least 6 characters long';
        return; // Stop further execution if password is weak
    }
    



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
        setCookie('isLoggedIn', 'true', 3);
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

document.getElementById('verifyOtpButton').addEventListener('click', () => {
    const email = document.getElementById('emailReg').value;
    const otp = document.getElementById('otp').value;
    const password = document.getElementById('passwordReg').value;
    

 
    
    // Send encrypted data to server
    fetch('/verify-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email,otp,password }),
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('message').innerText = data.message;
        if (data.message === 'OTP verified and user registered successfully') {
            closeRegPopup(); // Close the registration popup
            document.querySelector(".login-button").classList.add("d-none");         
            document.querySelector(".Register-button").classList.add("d-none");
            document.querySelector(".loginIcon").classList.add('d-none');
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

function customEncrypt(data) {
    let encrypted = btoa(data); // Base64 encoding
    let shifted = '';
    for (let i = 0; i < encrypted.length; i++) {
        shifted += String.fromCharCode(encrypted.charCodeAt(i) + 5); // Shift characters by 5
    }
    return shifted;
}

// Login
document.getElementById('submit-login').addEventListener('click', () => {
    const email = document.getElementById('emailLog').value;
    const password = document.getElementById('password').value;

    const encryptedEmail = customEncrypt(email);
    const encryptedPassword = customEncrypt(password);

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: encryptedEmail, password: encryptedPassword  }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Login successful') {
          

            closeLoginPopup();
      
            document.getElementById("previousIti").classList.remove("d-none"); // Show Previous Itinerary button
            document.querySelector(".login-button").classList.add("d-none");         
            document.querySelector(".Register-button").classList.add("d-none"); // Set session storage to allow searches
            document.querySelector(".loginIcon").classList.add('d-none');

            setCookie('isLoggedIn', 'true', 3);
            localStorage.setItem('emailLog', email);

            // Check for previous itinerary after successful login
            checkForPreviousItinerary(email);
        } else {
            console.error('Wrong email/password');
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
            document.querySelector('.previti').style.display='block';
        } else {
            // Hide the button if no itinerary exists (optional, in case hidden by default)
            document.querySelector('.prev-iti').style.display = 'none';
            document.querySelector('.previti').style.display='none';
        }
    })
    .catch(error => {
        console.error('Error checking itinerary:', error);
    });
}

document.querySelector('.prev-iti').addEventListener('click', () => {
    const newWindow2 = window.open('/histprompt', '_blank'); 

    if (!newWindow2) {
        console.error("Failed to open new window. It may have been blocked by a popup blocker.");
        return; 
    }
})

document.querySelector('.previti').addEventListener('click', () => {
    const newWindow2 = window.open('/histprompt', '_blank'); 

    if (!newWindow2) {
        console.error("Failed to open new window. It may have been blocked by a popup blocker.");
        return; 
    }
})

function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    name = name + "=";
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
}


window.onload = function() {
    const isLoggedIn = getCookie('isLoggedIn'); // Get the 'isLoggedIn' cookie
    const emailLog = localStorage.getItem('emailLog'); // Check local storage for the logged-in email

    if (isLoggedIn === 'true') {
        // If the user is logged in, hide the login and register buttons
        document.querySelector('.login-button').style.display = 'none';
        document.querySelector('.Register-button').style.display = 'none';
        document.querySelector(".loginIcon").classList.add('d-none');

        // Optionally, show the user's previous itinerary or logged-in UI
        checkForPreviousItinerary(emailLog);
    }
};


function checkLoginStatus() {
    const isLoggedIn = getCookie('isLoggedIn');
    if (isLoggedIn === 'true') {
        document.querySelector('.prev-iti').classList.remove('d-none');
        document.querySelector('.previti').classList.remove('d-none')
    } else {
        console.error("User is not logged in.");
    }
}


function showModal() {
    // Create the modal background (overlay)
    const modalOverlay = document.createElement('div');
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';

    // Create the modal box
    const modalBox = document.createElement('div');
    modalBox.style.width = '400px';
    modalBox.style.padding = '20px';
    modalBox.style.backgroundColor = '#fff';
    modalBox.style.borderRadius = '8px';
    modalBox.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    modalBox.style.textAlign = 'center';

    // Add the modal message
    const modalMessage = document.createElement('p');
    modalMessage.textContent = 'Please register/login to search more';
    modalMessage.style.marginBottom = '20px';
    modalMessage.style.fontSize = '18px';
    modalMessage.style.color = '#333';
    modalBox.appendChild(modalMessage);

    // Add the "Login" button
    const loginButton = document.createElement('button');
    loginButton.textContent = 'Register';
    loginButton.style.padding = '10px 20px';
    loginButton.style.backgroundColor = '#007bff';
    loginButton.style.color = '#fff';
    loginButton.style.border = 'none';
    loginButton.style.borderRadius = '5px';
    loginButton.style.cursor = 'pointer';
    loginButton.style.marginRight = '10px';

    // Redirect to login page when "Login" button is clicked
    loginButton.addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
        openRegisterPopup(); // Call the openLoginPopup function
    });

    modalBox.appendChild(loginButton);

    // Add the "Close" button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '10px 20px';
    closeButton.style.backgroundColor = '#6c757d';
    closeButton.style.color = '#fff';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';

    // Close the modal when "Close" button is clicked
    closeButton.addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });

    modalBox.appendChild(closeButton);

    // Add the modal box to the modal overlay
    modalOverlay.appendChild(modalBox);

    // Add the modal overlay to the document body
    document.body.appendChild(modalOverlay);
}

function stringToArrayBuffer(str) {
    return new TextEncoder().encode(str);
}

function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

async function hashSecretKey(secretKey) {
    const keyMaterial = stringToArrayBuffer(secretKey); 
    return await window.crypto.subtle.digest('SHA-256', keyMaterial); 
}

// Function to generate an AES-GCM key from a hashed secret
async function generateKeyFromSecret(secretKey) {
    const hashedKey = await hashSecretKey(secretKey); // Hash the secret key
    return await window.crypto.subtle.importKey(
        'raw', // Use raw key material
        hashedKey, // Use the hashed key
        { name: 'AES-GCM' }, // Algorithm to use
        false, // Key should not be extractable
        ['encrypt'] // Only allow encryption
    );
}

function handleCredentialResponse(response) {
    // This is where you'll handle the Google OAuth token

    // Decode the ID token to get the user profile information
    const data = parseJwt(response.credential);

    // Extract the necessary information from the JWT payload (e.g., email, name)
    const email = data.email;
    const name = data.name;

    // Send the decoded token data to the backend
    fetch('/auth-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('message').innerText = data.message;

        setCookie('isLoggedIn', 'true', 3);
        localStorage.setItem('emailLog', email);

        
            closeRegPopup();
            closeLoginPopup();
            document.querySelector(".login-button").classList.add("d-none");
            document.querySelector(".Register-button").classList.add("d-none");
            document.getElementById("previousIti").classList.remove("d-none"); // Show Previous Itinerary button
            document.querySelector(".loginIcon").classList.add('d-none');

    })
    .catch(err => {
        console.error('Error:', err);
        document.getElementById('message').innerText = 'An error occurred during registration';
    });
}

// Utility function to decode the JWT token
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}


function simpleEncrypt(data) {
    let shifted = '';
    for (let i = 0; i < data.length; i++) {
        shifted += String.fromCharCode(data.charCodeAt(i) + 5); // Shift characters forward by 5
    }
    return btoa(shifted); // Base64 encode the shifted string
}

async function simpleEncrypt(prompt, secretKey) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Generate random 12-byte IV (Initialization Vector)
    const key = await generateKeyFromSecret(secretKey); // Generate AES-GCM key

    const encodedPrompt = stringToArrayBuffer(JSON.stringify(prompt)); // Convert prompt to ArrayBuffer

    const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        encodedPrompt
    );

    return {
        encryptedPrompt: arrayBufferToBase64(encryptedData),
        iv: arrayBufferToBase64(iv)
    };
}

function stringToArrayBuffer(str) {
    return new TextEncoder().encode(str);
}

async function hashSecretKey(secretKey) {
    const keyMaterial = stringToArrayBuffer(secretKey); 
    return await window.crypto.subtle.digest('SHA-256', keyMaterial); 
}

// Custom method to set a cookie with encryption
function setCookie(name, value, days) {
    const encryptedValue = encryptData(value); // Encrypt the value before setting it in the cookie
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); // Expiry in 'days' (here: 2 days)
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${encryptedValue};${expires};path=/`; // Set the cookie with encryption
}

// Custom method to get a cookie and decrypt its value
function getCookie(name) {
    const cookieName = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i].trim();
        if (cookie.indexOf(cookieName) === 0) {
            const encryptedValue = cookie.substring(cookieName.length, cookie.length);
            return decryptData(encryptedValue); // Decrypt the cookie value before returning
        }
    }
    return ""; // Return an empty string if the cookie is not found
}

// Custom encryption method
function encryptData(data) {
    // A very basic custom encryption (this should be replaced with a secure algorithm in a real use case)
    const b64Encoded = btoa(data); // Base64 encoding as a simple form of "encryption"
    let encrypted = '';
    for (let i = 0; i < b64Encoded.length; i++) {
        encrypted += String.fromCharCode(b64Encoded.charCodeAt(i) + 3); // Shift characters by 3
    }
    return encrypted;
}

// Custom decryption method
function decryptData(encryptedData) {
    let decrypted = '';
    for (let i = 0; i < encryptedData.length; i++) {
        decrypted += String.fromCharCode(encryptedData.charCodeAt(i) - 3); // Shift characters back by 3
    }
    const b64Decoded = atob(decrypted); // Base64 decoding
    return b64Decoded;
}


function customXOREncrypt(text, key) {
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
        encrypted += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return encrypted;
}

let currentIndex = 0;

// Function to update the header text
function updateOverlayText() {
    overlayTextElement.textContent = overlayTexts[currentIndex];
    currentIndex = (currentIndex + 1) % overlayTexts.length; // Loop back to the start
}

// Initial text and interval setup
updateOverlayText();
setInterval(updateOverlayText, 10000);

// Array of video file paths
const videoFiles = [
    "videos/cylceland.mp4",
    'videos/lofoten cliff.mp4',
    'videos/zambiaBridge.mp4',
    'videos/maderia sea.mp4',
    'videos/drone river.mp4',
    'videos/venezia.mp4',  
    'videos/cylceland.mp4',
    'videos/zambiaBridge.mp4',
    'videos/maderia sea.mp4',
    'videos/shark swimy.mp4'
];

// Get the video element
const videoPlayer = document.getElementById("videoPlayer");

// Initialize the current video index
let currentVideoIndex = 0;

// Function to load and play the next video
function playNextVideo() {
    // Update the source of the video element
    videoPlayer.src = videoFiles[currentVideoIndex];

    // Play the video
    videoPlayer.play();

    // Update the index for the next video
    currentVideoIndex = (currentVideoIndex + 1) % videoFiles.length;
}

// Event listener for 'ended' to trigger the next video
videoPlayer.addEventListener("ended", playNextVideo);

// Start the first video
playNextVideo();

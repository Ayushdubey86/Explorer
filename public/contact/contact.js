document.getElementById('submit').addEventListener('click', async function () {
    // Capture form data
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    const number = document.getElementById('number').value;
    const query = document.getElementById('query').value;

    // Simple validation
    if (!email || !name || !number || !query) {
        alert("All fields are required!");
        return;
    }

    // Prepare data object
    const formData = {
        email: email,
        name: name,
        phone: number,
        query: query
    };

    try {
        const res = await fetch('/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData) // Directly stringify formData
        });

        // Check if the response is OK
        if (res.ok) {
            const data = await res.json();
            alert('Email sent successfully');
            console.log('Response:', data);
        } else {
            console.error('Server error:', res.statusText);
            alert('Failed to send the email.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while sending the email.');
    }
});

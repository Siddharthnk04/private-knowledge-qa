const axios = require('axios');

async function ask() {
    try {
        console.log("Sending request...");
        const response = await axios.post('http://localhost:3001/ask', {
            question: "What are the core working hours?"
        });
        console.log("Response status:", response.status);
        console.log("Response data:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("Caught error!");
        if (error.response) {
            console.error("Response data:", JSON.stringify(error.response.data, null, 2));
            console.error("Response status:", error.response.status);
        } else if (error.request) {
            console.error("No response received");
        } else {
            console.error("Error message:", error.message);
        }
    }
}

ask();

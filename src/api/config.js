// src/api/config.js

// ✅ Use ngrok URL for complete app
const BASE_URL = 'https://e0c20009c203.ngrok-free.app/api';

// For local development:
// const BASE_URL = 'http://localhost:5000/api';

// For React Native Android emulator:
// const BASE_URL = 'http://10.0.2.2:5000/api';

// Export karo taki app ke kisi bhi hisse mein use ho sake
export { BASE_URL };

// Optional: Debug ke liye log
console.log('[API] BASE_URL =', BASE_URL);

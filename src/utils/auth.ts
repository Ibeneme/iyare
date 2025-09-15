// src/utils/auth.js

export const isAuthenticated = () => {
    try {
        const userString = localStorage.getItem('user');
        // Get the token directly from localStorage as well
        const tokenString = localStorage.getItem('token'); 

        // Check if both the user object and the token exist
        if (userString && tokenString) {
            const user = JSON.parse(userString);
            // We now have both the user object and the token.
            // A simple check to ensure the user object exists is enough.
            return !!user; // The '!!' converts the object to a boolean (true)
        }
    } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        return false;
    }
    // If either userString or tokenString is null, this will return false
    return false;
};
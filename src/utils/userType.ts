export const getUserType = (): string | null => {
    try {
        const stored = localStorage.getItem("userType");


        if (!stored) {
            console.log("User type not found in localStorage.");
            return null;
        }

        let value = stored;

        if (stored.startsWith("{") || stored.startsWith("[")) {
            const parsed = JSON.parse(stored);
            value = parsed.userType || null;
        }

        console.log("Retrieved userType:", value);
        return value;
    } catch (err) {
        console.error("Error reading userType:", err);
        return null;
    }
};
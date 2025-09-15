

export const formatKey = (key: string): string => {
    const withSpaces = key.replace(/([a-z])([A-Z])/g, "$1 $2");
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
};

export const formatDisplayValue = (key: string, value: any): string => {
    if (key === "isSuspended") return value ? "Suspended" : "Active";

    if (key === "createdAt" && typeof value === "string") {
        const date = new Date(value);
        const days = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];
        const getOrdinal = (n: number) => {
            if (n > 3 && n < 21) return "th";
            switch (n % 10) {
                case 1:
                    return "st";
                case 2:
                    return "nd";
                case 3:
                    return "rd";
                default:
                    return "th";
            }
        };
        const dayOfWeek = days[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const ordinal = getOrdinal(day);
        return `${dayOfWeek} ${day}${ordinal} ${month}, ${year}`;
    }

    if (key === "role" && value === "superadmin") return "Super Admin";

    if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "None";

    return value;
};
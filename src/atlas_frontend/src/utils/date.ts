export function formatDate(timestamp: number) {
    if (!timestamp || isNaN(timestamp)) throw new Error("Invalid date");
    
    const date = new Date(Number(timestamp));
    if (isNaN(date.getTime())) throw new Error("Invalid date");
    
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = String(date.getUTCFullYear()).slice(-2); // Get last two digits of year
    
    return `${day}-${month}-${year}`;
}

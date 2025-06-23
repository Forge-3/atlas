export function formatDate(timestamp: number) {
    if (!timestamp || isNaN(timestamp)) throw new Error("Invalid date");
    
    const date = new Date(Number(timestamp));
    if (isNaN(date.getTime())) throw new Error("Invalid date");
    
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = String(date.getUTCFullYear()).slice(-2); // Get last two digits of year
    
    return `${day}-${month}-${year}`;
}

export function formatUtcDate(timestamp: string | number): string {
  const date = new Date(Number(timestamp) / 1_000_000); // Nanoseconds to ms
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");

  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  const suffix = date.getUTCHours() >= 12 ? "PM" : "AM";

  return `${y}/${m}/${d}, ${hours}:${minutes}:${seconds} ${suffix}`;
}

export function timeAgo(timestamp: string | number): string {
  const now = Date.now();
  const date = new Date(Number(timestamp) / 1_000_000); // Nanoseconds to ms
  const seconds = Math.floor((now - date.getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const { label, seconds: interval } of intervals) {
    const count = Math.floor(seconds / interval);
    if (count >= 1) {
      return `${count} ${label}${count !== 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}
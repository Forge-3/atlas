export function sortKeys(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(sortKeys);
    } else if (obj !== null && typeof obj === "object") {
      return Object.keys(obj)
        .sort()
        .reduce((acc, key) => {
          acc[key] = sortKeys(obj[key]);
          return acc;
        }, {} as any);
    }
    return obj;
}
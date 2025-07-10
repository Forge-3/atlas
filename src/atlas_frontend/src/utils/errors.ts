export const parseBlockchainError = (err: any) => {
  if (err?.message) {
    return extractRustError(err?.message);
  }
  return parseEntry(err);
};

type ErrorValue = string | number | bigint | null | ErrorObject | ErrorArray;
type ErrorObject = { [key: string]: ErrorValue };
type ErrorArray = Array<ErrorObject | ErrorArray>;

function parseEntry(entry: ErrorValue): string {
  if (Array.isArray(entry)) {
    return entry.map(parseEntry).join(', ');
  }

  if (typeof entry === 'object' && entry !== null) {
    const parts: string[] = [];

    for (const [key, value] of Object.entries(entry)) {
      const label = formatKey(key);
      const valueString = parseEntry(value);

      if (typeof value === 'object' && value !== null) {
        // If value is an object/array, format with nested label
        parts.push(`${label}: ${valueString}`);
      } else if (value === null) {
        parts.push(`${label}`);
      } else {
        parts.push(`${label}: ${valueString}`);
      }
    }

    return parts.join(', ');
  }

  return formatValue(entry);
}

function formatKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_\-]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function formatValue(value: ErrorValue): string {
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string') {
    return value.replace(/\btoo\b/g, 'is too');
  }
  if (value === null) return 'null';
  return String(value);
}

export const extractRustError = (message: any) => {
  const regex = /([A-Za-z0-9_]+)\(\\"(.*?)\\"\)/;
  const match = message.match(regex);
  const maybeError = match ? `${match[1]}(\\"${match[2]}\\")` : null;

  if (maybeError) {
    return makeRustErrorReadable(maybeError);
  }
  return "Unknown error";
};

function makeRustErrorReadable(errorStr: string) {
  const match = errorStr.match(/(\w+)\s*\\?\(\\"(.+)\\"\)/);

  if (!match || match.length < 3) {
    return "Unknown error";
  }

  const [, errorType, message] = match;

  const readableType = errorType
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();

  const finalType =
    readableType.charAt(0).toUpperCase() + readableType.slice(1);

  return `${finalType}: ${message}`;
}

export const getErrorWithInfoToast = (externalInfo: string) => {
  return (err: any) => `${externalInfo} ${parseBlockchainError(err)}`;
};

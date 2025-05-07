import {type Error} from "../../../declarations/atlas_main/atlas_main.did.js"

function formatPascalCase(input: string): string {
    return input
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // Insert space before capital letters
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Handle consecutive capitals like "JSONParseError"
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .toLowerCase() // Lowercase everything
      .replace(/^./, str => str.toUpperCase()); // Capitalize the first letter again
  }

export const formatErrorMsg = (err: Error) => {
    const [[key, value]] = Object.entries(err)
    return formatPascalCase(key)
}
/**
 * Decode a base64 PDF from the API response.
 * Usage: node scripts/decode-pdf.js <output.pdf>
 * Then paste the base64 string and press Enter.
 */
const fs = require("fs");
const readline = require("readline");

const outputPath = process.argv[2] || "output.pdf";

const rl = readline.createInterface({ input: process.stdin });
console.log("Paste the base64 PDF string and press Enter:");

rl.on("line", (line) => {
  const buffer = Buffer.from(line.trim(), "base64");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Saved to ${outputPath} (${buffer.length} bytes)`);
  rl.close();
});

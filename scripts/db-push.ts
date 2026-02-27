
import "dotenv/config";
import { execSync } from "child_process";

console.log("Loading environment variables...");

if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is missing from environment/file!");
    process.exit(1);
}

console.log("DATABASE_URL found. Running drizzle-kit push...");

try {
    // We pass the current process.env which now has DATABASE_URL
    execSync("npx drizzle-kit push", { stdio: "inherit", env: process.env });
    console.log("Schema push completed successfully.");
} catch (error) {
    console.error("Schema push failed.");
    process.exit(1);
}

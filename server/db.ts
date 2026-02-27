import "dotenv/config";

// In demo mode, skip database entirely
const isDemo = process.env.NODE_ENV === "demo" || !process.env.DATABASE_URL;

let db: any = null;

if (!isDemo) {
  try {
    // Only attempt DB connection in production with DATABASE_URL set
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    const schema = await import("@shared/schema");

    const client = postgres(process.env.DATABASE_URL!, {
      max: 20,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    db = drizzle(client, { schema });
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
}

export { db };
export default db;

import { School } from "../models";
import { logger } from "../utils/logger.util";
import { exec } from "child_process";
import path from "path";

export const bootstrap = async () => {
  try {
    if (process.env.SEED_DUMMY_DATA === "true") {
      const schoolCount = await School.countDocuments();
      
      if (schoolCount === 0) {
        logger.info("No school found in database. Seeding dummy data...");
        
        // Run the seed script as a separate process to avoid database connection conflicts 
        // and to keep server.ts clean
        const seedPath = path.join(__dirname, "seed.ts");
        const tsNodeDevPath = path.join(process.cwd(), "node_modules", ".bin", "ts-node-dev");
        
        exec(`${tsNodeDevPath} --transpile-only ${seedPath}`, (error, stdout, stderr) => {
          if (error) {
            logger.error(`Seeding error: ${error.message}`);
            return;
          }
          if (stderr) {
            logger.error(`Seeding stderr: ${stderr}`);
          }
          logger.info(`Seeding output: ${stdout}`);
          logger.info("Dummy data seeded successfully.");
        });
      } else {
        logger.info("Database already contains data. Skipping seed.");
      }
    }
  } catch (error) {
    logger.error("Bootstrap error:", error);
  }
};

import "dotenv/config";
import { runScrape } from "./orchestrator.js";

runScrape()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Scrape run crashed:", e);
    process.exit(1);
  });

import "dotenv/config";
import { migrar } from "../src/db/migrar";

migrar().catch((error) => {
  console.error(error);
  process.exit(1);
});

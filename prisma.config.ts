import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations:{
    path: "prisma/migrations",
  },
  datasource: {
    // Use the "!" (non-null assertion) to tell TS the variable exists
    url: process.env["DATABASE_URL"]!, 
  },
});
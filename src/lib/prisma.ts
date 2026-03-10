import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import 'dotenv/config';


const connectionString = `${process.env.DIRECT_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);


declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({adapter});
global.prisma = prisma


export default prisma;
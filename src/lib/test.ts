import { calculateRanking } from './rankings';
import { Gender } from '../generated/prisma/client';
import "dotenv/config";


async function main() {
     const result = await calculateRanking(1, 97.5, 94, Gender.MALE);
     console.log(result);
   }
   main();
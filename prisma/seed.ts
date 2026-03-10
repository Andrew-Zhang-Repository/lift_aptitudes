import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = `${process.env.DIRECT_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


const lifts_list = [
  {
    name: "Bench Press",
    muscle_group: "Chest",
    secondary_muscles: ["Triceps", "Shoulders"],
    description: "Barbell flat bench press",
    is_compound: true,
  },
  {
    name: "Squat",
    muscle_group: "Quads",
    secondary_muscles: ["Glutes", "Hamstrings", "Core"],
    description: "Barbell back squat",
    is_compound: true,
  },
  {
    name: "Deadlift",
    muscle_group: "Glutes",
    secondary_muscles: ["Back", "Hamstrings", "Core","Quads"],
    description: "DeadLift",
    is_compound: true,
  },
  {
    name: "Bent Over Rows",
    muscle_group: "Back",
    secondary_muscles: ["Biceps","Core"],
    description: "Standard Barbell Rows",
    is_compound: true,
  },
  {
    name: "Shoulder Press",
    muscle_group: "Shoulders",
    secondary_muscles: ["Triceps"],
    description: "Shoulder Press",
    is_compound: true,
  },
  {
    name: "Barbell Curls",
    muscle_group: "Biceps",
    secondary_muscles: ["Forearms"],
    description: "Standard Bicep Curls",
    is_compound: false,
  },
  {
    name: "Power Clean",
    muscle_group: "Glutes",
    secondary_muscles: ["Hamstrings", "Core","Quads","Back"],
    description: "Power Clean",
    is_compound: true,
  },
]

const csvMappings = [
  { file: "bench_press_male.csv",      lift: "Bench Press",     gender: "MALE" as const },
  { file: "bench_press_female.csv",    lift: "Bench Press",     gender: "FEMALE" as const },
  { file: "squats_male.csv",           lift: "Squat",           gender: "MALE" as const },
  { file: "squats_female.csv",         lift: "Squat",           gender: "FEMALE" as const },
  { file: "dead_lift_male.csv",        lift: "Deadlift",        gender: "MALE" as const },
  { file: "dead_lift_female.csv",      lift: "Deadlift",        gender: "FEMALE" as const },
  { file: "bent_over_row_male.csv",    lift: "Bent Over Rows",  gender: "MALE" as const },
  { file: "bent_over_row_female.csv",  lift: "Bent Over Rows",  gender: "FEMALE" as const },
  { file: "shoulder_press_male.csv",   lift: "Shoulder Press",  gender: "MALE" as const },
  { file: "shoulder_press_female.csv", lift: "Shoulder Press",  gender: "FEMALE" as const },
  { file: "barbell_curl_male.csv",     lift: "Barbell Curls",   gender: "MALE" as const },
  { file: "barbell_curl_female.csv",   lift: "Barbell Curls",   gender: "FEMALE" as const },
  { file: "power_clean_male.csv",      lift: "Power Clean",     gender: "MALE" as const },
  { file: "power_clean_female.csv",    lift: "Power Clean",     gender: "FEMALE" as const },
];

const experienceLevels = ["BEGINNER", "NOVICE", "INTERMEDIATE", "ADVANCED", "ELITE"] as const;

async function main() {
  
    for (const item of lifts_list) {
        const insert = await prisma.lifts.upsert({
        where: {
        name: item.name
        },
        update: {
        },
        create: {
        name: item.name,
        muscle_group: item.muscle_group,
        secondary_muscles: item.secondary_muscles,
        description: item.description,
        is_compound: item.is_compound
        },
    })
    }



    for (const mapping of csvMappings) {

        const liftRecord = await prisma.lifts.findUnique({ where: { name: mapping.lift } });
        if (!liftRecord) {
            console.error(`Lift not found: ${mapping.lift}`);
            continue;
        }

        const filePath = path.join(__dirname, "seed_data", mapping.file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const lines = fileContent.trim().split("\n");
        const dataLines = lines.slice(1); 
    
        const standardRows = [];
        for (const line of dataLines) {
            const values = line.split(",").map(Number);
            const bodyweight = values[0];
            for (let i = 0; i < experienceLevels.length; i++) {
            standardRows.push({
                lift_id: liftRecord.id,
                gender: mapping.gender,
                bodyweight: bodyweight,
                experience_level: experienceLevels[i],
                standard: values[i + 1],
            });
            }
        }
        
        await prisma.strengthStandards.createMany({
            data: standardRows,
            skipDuplicates: true,
        });
        console.log(`Seeded ${standardRows.length} standards for ${mapping.lift} (${mapping.gender})`);
    }
}
main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });


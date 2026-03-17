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
  {
    name: "Dumbbell Press",
    muscle_group: "Chest",
    secondary_muscles: ["Triceps", "Shoulders"],
    description: "Flat dumbbell press",
    is_compound: true,
  },
  {
    name: "Incline Barbell Press",
    muscle_group: "Chest",
    secondary_muscles: ["Triceps", "Shoulders"],
    description: "Incline barbell bench press",
    is_compound: true,
  },
  {
    name: "Dumbbell Incline Press",
    muscle_group: "Chest",
    secondary_muscles: ["Triceps", "Shoulders"],
    description: "Incline dumbbell press",
    is_compound: true,
  },
  {
    name: "Lat Pulldown",
    muscle_group: "Back",
    secondary_muscles: ["Biceps"],
    description: "Cable lat pulldown",
    is_compound: true,
  },
  {
    name: "Pullups",
    muscle_group: "Back",
    secondary_muscles: ["Biceps"],
    description: "Bodyweight pullups",
    is_compound: true,
    is_bodyweight: true,
  },
  {
    name: "Shrugs",
    muscle_group: "Traps",
    secondary_muscles: [],
    description: "Barbell shrugs",
    is_compound: false,
  },
  {
    name: "Dumbbell Shoulder Press",
    muscle_group: "Shoulders",
    secondary_muscles: ["Triceps"],
    description: "Seated dumbbell shoulder press",
    is_compound: true,
  },
  {
    name: "Dumbbell Curl",
    muscle_group: "Biceps",
    secondary_muscles: ["Forearms"],
    description: "Standing dumbbell bicep curl",
    is_compound: false,
  },
  {
    name: "Tricep Pushdown",
    muscle_group: "Triceps",
    secondary_muscles: [],
    description: "Cable tricep pushdown",
    is_compound: false,
  },
  {
    name: "Leg Press",
    muscle_group: "Quads",
    secondary_muscles: ["Glutes"],
    description: "Machine leg press",
    is_compound: true,
  },
  {
    name: "Hack Squat",
    muscle_group: "Quads",
    secondary_muscles: ["Glutes"],
    description: "Machine hack squat",
    is_compound: true,
  },
  {
    name: "Calf Raises",
    muscle_group: "Calves",
    secondary_muscles: [],
    description: "Standing calf raises",
    is_compound: false,
  },
  {
    name: "Cable Crunch",
    muscle_group: "Abs",
    secondary_muscles: [],
    description: "Kneeling cable crunch",
    is_compound: false,
  },
  {
    name: "Hamstring Curls",
    muscle_group: "Hamstrings",
    secondary_muscles: [],
    description: "Hammy pulls",
    is_compound: false,
  },
  {
    name: "Forearm Curls",
    muscle_group: "Forearms",
    secondary_muscles: [],
    description: "Wrist curls",
    is_compound: false,
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
  { file: "dumbell_press_male.csv",    lift: "Dumbbell Press",  gender: "MALE" as const },
  { file: "dumbell_press_female.csv",  lift: "Dumbbell Press",  gender: "FEMALE" as const },
  { file: "incline_barbell_male.csv",  lift: "Incline Barbell Press", gender: "MALE" as const },
  { file: "incline_barbell_female.csv",lift: "Incline Barbell Press", gender: "FEMALE" as const },
  { file: "dumbell_incline_press_male.csv",   lift: "Dumbbell Incline Press", gender: "MALE" as const },
  { file: "dumbell_incline_press_female.csv", lift: "Dumbbell Incline Press", gender: "FEMALE" as const },
  { file: "lat_pulldown_male.csv",    lift: "Lat Pulldown",    gender: "MALE" as const },
  { file: "lat_pulldown_female.csv",  lift: "Lat Pulldown",    gender: "FEMALE" as const },
  { file: "pullups_male.csv",          lift: "Pullups",         gender: "MALE" as const },
  { file: "pullups_female.csv",        lift: "Pullups",         gender: "FEMALE" as const },
  { file: "shrugs_male.csv",           lift: "Shrugs",          gender: "MALE" as const },
  { file: "shrugs_female.csv",         lift: "Shrugs",          gender: "FEMALE" as const },
  { file: "dumbell_shoulder_press_male.csv", lift: "Dumbbell Shoulder Press", gender: "MALE" as const },
  { file: "dumbell_shoulder_press_female.csv", lift: "Dumbbell Shoulder Press", gender: "FEMALE" as const },
  { file: "dumbell_curl_male.csv",    lift: "Dumbbell Curl",   gender: "MALE" as const },
  { file: "dumbell_curl_female.csv",  lift: "Dumbbell Curl",   gender: "FEMALE" as const },
  { file: "tricep_pushdown_male.csv", lift: "Tricep Pushdown", gender: "MALE" as const },
  { file: "tricep_pushdown_female.csv", lift: "Tricep Pushdown", gender: "FEMALE" as const },
  { file: "legpress_male.csv",         lift: "Leg Press",       gender: "MALE" as const },
  { file: "legpres_female.csv",        lift: "Leg Press",       gender: "FEMALE" as const },
  { file: "hacksquat_male.csv",        lift: "Hack Squat",      gender: "MALE" as const },
  { file: "hacksquat_female.csv",      lift: "Hack Squat",      gender: "FEMALE" as const },
  { file: "calfraises_male.csv",      lift: "Calf Raises",     gender: "MALE" as const },
  { file: "calfraises_female.csv",    lift: "Calf Raises",     gender: "FEMALE" as const },
  { file: "cablecrunch_male.csv",      lift: "Cable Crunch",   gender: "MALE" as const },
  { file: "cablecrunch_female.csv",    lift: "Cable Crunch",   gender: "FEMALE" as const },
  { file: "hamstring_curl_male.csv",    lift: "Hamstring Curls",   gender: "MALE" as const },
  { file: "hamstring_curl_female.csv",    lift: "Hamstring Curls",   gender: "FEMALE" as const },
  { file: "forearm_curl_male.csv",    lift: "Forearm Curls",   gender: "MALE" as const },
  { file: "forearm_curl_female.csv",    lift: "Forearm Curls",   gender: "FEMALE" as const }
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
        is_compound: item.is_compound,
        is_bodyweight: item.is_bodyweight || false,
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


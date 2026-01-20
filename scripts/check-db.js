
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Manually load .env because we are running this script directly with node
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY

console.log("Checking connection to:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
    console.log("Attempting to select from 'units' table...");
    const { data, error } = await supabase.from('units').select('count', { count: 'exact', head: true });

    if (error) {
        console.error("❌ ERROR:", error.message);
        console.error("Details:", error);
    } else {
        console.log("✅ SUCCESS: Connected to 'units' table.");
        console.log("Table seems to exist.");
    }
}

check();

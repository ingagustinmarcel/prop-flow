
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// --- Environment Variable Loading ---
// In CI (GitHub Actions), secrets are injected as process.env.
// Locally, fall back to reading the .env file.
let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
let supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const envPath = join(__dirname, '../.env');
        const envConfig = dotenv.parse(fs.readFileSync(envPath));
        supabaseUrl = envConfig.VITE_SUPABASE_URL;
        supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
        console.log('Loaded credentials from local .env file.');
    } catch (e) {
        console.error('❌ FATAL: Could not load Supabase credentials from env or .env file.');
        process.exit(1);
    }
}

console.log(`🔌 Keep-Alive: Pinging Supabase at ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function keepAlive() {
    const { error } = await supabase.from('units').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Keep-Alive FAILED:', error.message);
        process.exit(1);
    } else {
        console.log('✅ Keep-Alive SUCCESS: Database is active.');
    }
}

keepAlive();

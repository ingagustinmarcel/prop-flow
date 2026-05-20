
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

console.log(`🔌 Keep-Alive ping at ${new Date().toISOString()}`);
console.log(`📡 Target: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function keepAlive() {
    const DUMMY_UNIT_NAME = 'SUPABASE_KEEPALIVE_DUMMY_UNIT_DO_NOT_USE';
    
    // Helper function for the 5-minute delay
    const delay = ms => new Promise(res => setTimeout(res, ms));

    console.log(`🔑 Step 0: Authenticating...`);
    const email = process.env.SUPABASE_USER_EMAIL || 'antigravity@test.com';
    const password = process.env.SUPABASE_USER_PASSWORD || 'Antigravity1234';
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('❌ FATAL: Authentication failed:', authError.message);
        process.exit(1);
    }

    const userId = authData.user.id;
    console.log(`✅ Authenticated successfully. User ID: ${userId}`);

    console.log(`🧹 Step 1: Cleaning up any old dummy units...`);
    const { error: cleanupError } = await supabase
        .from('units')
        .delete()
        .eq('name', DUMMY_UNIT_NAME);

    if (cleanupError) {
        console.warn('⚠️ Warning: Failed to clean up old dummy units. Continuing anyway...', cleanupError.message);
    }

    console.log(`📝 Step 2: Creating a new dummy unit...`);
    const { data: newUnit, error: insertError } = await supabase
        .from('units')
        .insert([{ 
            name: DUMMY_UNIT_NAME,
            tenant: 'System',
            rent: 0,
            is_active: false,
            user_id: userId
        }])
        .select('id')
        .single();

    if (insertError) {
        console.error('❌ FATAL: Failed to create dummy unit:', insertError.message);
        console.error('Details:', JSON.stringify(insertError, null, 2));
        process.exit(1);
    }

    console.log(`✅ Dummy unit created successfully (ID: ${newUnit.id}).`);
    
    // Wait for 5 minutes (300,000 milliseconds) or 2 seconds in test mode
    const isTest = process.env.TEST_MODE === 'true';
    const waitMinutes = isTest ? 0.05 : 5;
    const delayMs = isTest ? 1000 : 60 * 1000;
    console.log(`⏳ Step 3: Waiting for ${isTest ? 'a few seconds' : waitMinutes + ' minutes'} to ensure Supabase registers active usage...`);
    
    // Log progress
    if (isTest) {
        await delay(2000);
        console.log(`   ... test wait finished ...`);
    } else {
        for (let i = 1; i <= waitMinutes; i++) {
            await delay(delayMs);
            console.log(`   ... ${i} minute(s) passed ...`);
        }
    }

    console.log(`🗑️ Step 4: Deleting the dummy unit...`);
    const { error: deleteError } = await supabase
        .from('units')
        .delete()
        .eq('id', newUnit.id);

    if (deleteError) {
        console.error(`❌ FATAL: Failed to delete dummy unit (ID: ${newUnit.id}):`, deleteError.message);
        console.error('You may need to delete it manually to avoid clutter.');
        process.exit(1);
    }

    console.log(`✅ Keep-Alive SUCCESS — Dummy unit created and deleted without a trace.`);
    console.log(`⏰ Next ping in ~3 days (cron: 0 0 */3 * *)`);
}

keepAlive();

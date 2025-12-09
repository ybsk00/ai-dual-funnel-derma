const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_UID = 'da35cfdb-dbf6-4d7c-af27-1a118b22e637';
const ADMIN_EMAIL = 'admin@admin.com';

async function grantAdminAccess() {
    console.log(`Granting admin access to UID: ${ADMIN_UID}`);

    // Check if user exists in auth.users (optional, but good for verification)
    // Note: Service role can access auth.users, but we might just trust the UID for now.

    // Check if already in staff_users
    const { data: existingUser, error: fetchError } = await supabase
        .from('staff_users')
        .select('*')
        .eq('user_id', ADMIN_UID)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error('Error checking staff_users:', fetchError);
        return;
    }

    if (existingUser) {
        console.log('User already exists in staff_users.');
        if (existingUser.role !== 'admin') {
            console.log('Updating role to admin...');
            const { error: updateError } = await supabase
                .from('staff_users')
                .update({ role: 'admin' })
                .eq('user_id', ADMIN_UID);

            if (updateError) {
                console.error('Error updating role:', updateError);
            } else {
                console.log('Successfully updated role to admin.');
            }
        } else {
            console.log('User is already an admin.');
        }
    } else {
        console.log('Inserting new admin user into staff_users...');
        const { error: insertError } = await supabase
            .from('staff_users')
            .insert([
                {
                    user_id: ADMIN_UID,
                    role: 'admin',
                    name: 'System Admin', // You can customize this
                },
            ]);

        if (insertError) {
            console.error('Error inserting admin user:', insertError);
        } else {
            console.log('Successfully granted admin access.');
        }
    }
}

grantAdminAccess();

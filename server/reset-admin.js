const db = require('./db');
const bcrypt = require('bcryptjs');

async function resetPassword() {
    try {
        const password = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        console.log(`Setting password for admin to '${password}' with hash: ${hash}`);

        // Check if user exists
        const users = await db.query("SELECT * FROM users WHERE username = 'admin'");
        if (users.length === 0) {
            console.log('User admin not found, creating new admin user...');
            await db.execute(
                "INSERT INTO users (username, password_hash, full_name, role) VALUES ('admin', ?, 'Administrator', 'admin')",
                [hash]
            );
        } else {
            console.log('User admin found, updating password...');
            await db.execute(
                "UPDATE users SET password_hash = ? WHERE username = 'admin'",
                [hash]
            );
        }

        console.log('✅ Password reset successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to reset password:', err);
        process.exit(1);
    }
}

resetPassword();

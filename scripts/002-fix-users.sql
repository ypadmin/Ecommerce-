-- First, let's create the users with properly hashed passwords
-- Password for admin: admin123
-- Password for cashier: cashier123

-- Delete existing users if they exist
DELETE FROM users WHERE username IN ('admin', 'cashier');

-- Insert admin user with properly hashed password (admin123)
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@store.com', '$2b$12$LQv3c1yqBw2uuCD4MicOyuFsAHgr.Oa.kZrwGOAwtbud9xyGWzLHu', 'admin');

-- Insert cashier user with properly hashed password (cashier123)  
INSERT INTO users (username, email, password_hash, role) 
VALUES ('cashier', 'cashier@store.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cashier');

-- Verify the users were created
SELECT id, username, email, role, created_at FROM users;

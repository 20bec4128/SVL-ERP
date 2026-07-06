UPDATE app_users
SET force_password_change = false
WHERE force_password_change = true;

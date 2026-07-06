-- add columns to store design choice details on chat messages

ALTER TABLE lead_chat_message
    ADD COLUMN IF NOT EXISTS design_action VARCHAR(50),
    ADD COLUMN IF NOT EXISTS design_comment TEXT;
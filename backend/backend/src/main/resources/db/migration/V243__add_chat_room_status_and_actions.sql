CREATE TABLE chat_room_user_settings (
    id BIGSERIAL PRIMARY KEY,
    chat_room_id BIGINT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    last_read_at TIMESTAMP,
    CONSTRAINT uq_chat_room_user UNIQUE(chat_room_id, user_id)
);

CREATE TABLE user_blocks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    blocked_user_id BIGINT NOT NULL,
    CONSTRAINT uq_user_block UNIQUE(user_id, blocked_user_id)
);

-- Table for tagging users in stories
CREATE TABLE IF NOT EXISTS story_tags (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    tagged_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tagged_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (story_id, tagged_user_id)
);

-- Table for likes/dislikes on stories
CREATE TABLE IF NOT EXISTS story_likes (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value INTEGER NOT NULL CHECK (value IN (1, -1)), -- 1 for like, -1 for dislike
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (story_id, user_id)
); 
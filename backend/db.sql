-- Create Tables
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    user_type VARCHAR NOT NULL DEFAULT 'individual',
    location VARCHAR,
    eco_interests JSONB,
    created_at VARCHAR NOT NULL
);

CREATE TABLE user_impact (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    date VARCHAR NOT NULL,
    daily_score NUMERIC NOT NULL,
    weekly_score NUMERIC NOT NULL,
    monthly_score NUMERIC NOT NULL,
    category_breakdown JSONB NOT NULL
);

CREATE TABLE transportation_logs (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    mode VARCHAR NOT NULL,
    distance NUMERIC NOT NULL,
    date VARCHAR NOT NULL,
    start_location VARCHAR,
    end_location VARCHAR
);

CREATE TABLE energy_logs (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    energy_type VARCHAR NOT NULL,
    usage_amount NUMERIC NOT NULL,
    unit VARCHAR NOT NULL,
    date VARCHAR NOT NULL
);

CREATE TABLE waste_logs (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    waste_type VARCHAR NOT NULL,
    weight NUMERIC NOT NULL,
    date VARCHAR NOT NULL,
    photo_url VARCHAR
);

CREATE TABLE diet_logs (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    meal_type VARCHAR NOT NULL,
    date VARCHAR NOT NULL,
    details VARCHAR
);

CREATE TABLE shopping_logs (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    item_name VARCHAR NOT NULL,
    is_eco_friendly BOOLEAN NOT NULL,
    date VARCHAR NOT NULL,
    receipt_url VARCHAR
);

CREATE TABLE goals (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    title VARCHAR NOT NULL,
    target_value NUMERIC NOT NULL,
    start_date VARCHAR NOT NULL,
    end_date VARCHAR NOT NULL,
    progress NUMERIC DEFAULT 0,
    status VARCHAR DEFAULT 'active'
);

CREATE TABLE challenges (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    start_date VARCHAR NOT NULL,
    end_date VARCHAR NOT NULL,
    rules VARCHAR
);

CREATE TABLE user_challenges (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    challenge_id VARCHAR NOT NULL REFERENCES challenges(id),
    join_date VARCHAR NOT NULL,
    progress NUMERIC DEFAULT 0
);

CREATE TABLE tips (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    content VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    created_at VARCHAR NOT NULL
);

CREATE TABLE impact_explanations (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    content VARCHAR NOT NULL,
    media_url VARCHAR,
    created_at VARCHAR NOT NULL
);

CREATE TABLE news_feeds (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    content VARCHAR NOT NULL,
    source VARCHAR NOT NULL,
    url VARCHAR NOT NULL,
    created_at VARCHAR NOT NULL
);

CREATE TABLE forums (
    id VARCHAR PRIMARY KEY,
    category VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    content VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    created_at VARCHAR NOT NULL
);

CREATE TABLE forum_posts (
    id VARCHAR PRIMARY KEY,
    forum_id VARCHAR NOT NULL REFERENCES forums(id),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    content VARCHAR NOT NULL,
    created_at VARCHAR NOT NULL
);

CREATE TABLE business_profiles (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR UNIQUE NOT NULL REFERENCES users(id),
    company_name VARCHAR NOT NULL,
    industry VARCHAR NOT NULL,
    created_at VARCHAR NOT NULL
);

CREATE TABLE supply_chain_logs (
    id VARCHAR PRIMARY KEY,
    business_profile_id VARCHAR NOT NULL REFERENCES business_profiles(id),
    supplier_name VARCHAR NOT NULL,
    sustainability_rating VARCHAR NOT NULL,
    log_date VARCHAR NOT NULL
);

CREATE TABLE reminders (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    reminder_type VARCHAR NOT NULL,
    schedule JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_follows (
    id VARCHAR PRIMARY KEY,
    follower_id VARCHAR NOT NULL REFERENCES users(id),
    followed_id VARCHAR NOT NULL REFERENCES users(id),
    created_at VARCHAR NOT NULL
);

CREATE TABLE tip_ratings (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    tip_id VARCHAR NOT NULL REFERENCES tips(id),
    rating NUMERIC NOT NULL,
    created_at VARCHAR NOT NULL
);

CREATE TABLE user_bookmarks (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    tip_id VARCHAR REFERENCES tips(id),
    impact_explanation_id VARCHAR REFERENCES impact_explanations(id),
    created_at VARCHAR NOT NULL
);

-- Seed Data
INSERT INTO users (id, email, password_hash, name, user_type, location, eco_interests, created_at) VALUES
('user1', 'user1@example.com', 'password123', 'Alice Smith', 'individual', 'New York', '{"interests": ["recycling", "clean energy"]}', '2023-10-05T14:30:00Z'),
('user2', 'user2@example.com', 'admin123', 'Bob Johnson', 'business', 'London', NULL, '2023-10-04T10:00:00Z'),
('user3', 'user3@example.com', 'user123', 'Charlie Brown', 'individual', 'Paris', '{"interests": ["sustainable diet", "public transport"]}', '2023-10-03T12:15:00Z');

INSERT INTO user_impact (id, user_id, date, daily_score, weekly_score, monthly_score, category_breakdown) VALUES
('ui1', 'user1', '2023-10-05', 85, 92, 88, '{"transport": 30, "energy": 25, "waste": 30}'),
('ui2', 'user2', '2023-10-05', 70, 78, 72, '{"transport": 20, "energy": 30, "waste": 20}'),
('ui3', 'user3', '2023-10-05', 90, 95, 92, '{"transport": 35, "energy": 25, "waste": 30}');

INSERT INTO transportation_logs (id, user_id, mode, distance, date, start_location, end_location) VALUES
('tl1', 'user1', 'bike', 5.5, '2023-10-05', 'Home', 'Work'),
('tl2', 'user2', 'car', 15.2, '2023-10-04', 'Office', 'Client'),
('tl3', 'user3', 'train', 20.0, '2023-10-05', 'Station A', 'Station B');

INSERT INTO waste_logs (id, user_id, waste_type, weight, date, photo_url) VALUES
('wl1', 'user1', 'plastic', 2.5, '2023-10-05', 'https://picsum.photos/seed/waste-1/200/300'),
('wl2', 'user2', 'paper', 1.8, '2023-10-04', 'https://picsum.photos/seed/waste-2/200/300'),
('wl3', 'user3', 'glass', 3.0, '2023-10-03', 'https://picsum.photos/seed/waste-3/200/300');

INSERT INTO shopping_logs (id, user_id, item_name, is_eco_friendly, date, receipt_url) VALUES
('sl1', 'user1', 'organic vegetables', TRUE, '2023-10-05', 'https://picsum.photos/seed/receipt-1/300/200'),
('sl2', 'user2', 'plastic packaging', FALSE, '2023-10-04', 'https://picsum.photos/seed/receipt-2/300/200'),
('sl3', 'user3', 'reusable bottles', TRUE, '2023-10-03', 'https://picsum.photos/seed/receipt-3/300/200');

INSERT INTO goals (id, user_id, title, target_value, start_date, end_date, progress, status) VALUES
('g1', 'user1', 'Reduce Energy Usage', 500, '2023-10-01', '2023-12-31', 120, 'active'),
('g2', 'user2', 'Increase Recycling', 2000, '2023-10-05', '2024-03-31', 45, 'active'),
('g3', 'user3', 'Walk 1000 km', 1000, '2023-01-01', '2023-12-31', 750, 'active');

INSERT INTO challenges (id, title, description, start_date, end_date, rules) VALUES
('ch1', 'Plastic Free October', 'Avoid single-use plastics for October', '2023-10-01', '2023-10-31', 'No plastic bags, bottles, or packaging'),
('ch2', 'Energy Saving Challenge', 'Reduce energy consumption by 20%', '2023-11-01', '2024-01-31', 'Optimize heating and lighting');

INSERT INTO user_challenges (id, user_id, challenge_id, join_date, progress) VALUES
('uc1', 'user1', 'ch1', '2023-10-05', 75),
('uc2', 'user3', 'ch2', '2023-11-01', 30);

INSERT INTO tips (id, title, content, category, created_at) VALUES
('t1', 'Save Energy at Home', 'Use LED bulbs and unplug devices when not in use', 'energy', '2023-10-04T09:00:00Z'),
('t2', 'Reduce Food Waste', 'Plan meals and store food properly', 'waste', '2023-10-03T11:30:00Z');

INSERT INTO impact_explanations (id, title, content, media_url, created_at) VALUES
('ie1', 'Carbon Footprint Basics', 'Explanation of how daily choices affect carbon emissions', 'https://picsum.photos/seed/ie-1/400/300', '2023-10-02T14:00:00Z'),
('ie2', 'Water Conservation', 'Importance of saving water resources', 'https://picsum.photos/seed/ie-2/400/300', '2023-10-01T10:15:00Z');

INSERT INTO forums (id, category, title, content, user_id, created_at) VALUES
('f1', 'transportation', 'Best Bike Routes', 'Discuss optimal cycling paths in the city', 'user1', '2023-10-05T16:00:00Z'),
('f2', 'diet', 'Sustainable Eating', 'Share plant-based recipes and tips', 'user3', '2023-10-04T13:30:00Z');

INSERT INTO forum_posts (id, forum_id, user_id, content, created_at) VALUES
('fp1', 'f1', 'user2', 'Try the river path route - it''s scenic and safe!', '2023-10-05T17:00:00Z'),
('fp2', 'f2', 'user1', 'Lentil soup recipe: 1 cup lentils, 3 cups veggie broth...', '2023-10-04T15:00:00Z');

INSERT INTO business_profiles (id, user_id, company_name, industry, created_at) VALUES
('bp1', 'user2', 'GreenTech Solutions', 'Renewable Energy', '2023-10-05T10:00:00Z');

INSERT INTO supply_chain_logs (id, business_profile_id, supplier_name, sustainability_rating, log_date) VALUES
('sl1', 'bp1', 'EcoMaterials Inc', 'A', '2023-10-05'),
('sl2', 'bp1', 'GreenParts Ltd', 'B', '2023-10-04');

INSERT INTO reminders (id, user_id, reminder_type, schedule, is_active) VALUES
('r1', 'user1', 'weekly_recycling', '{"day": "Friday", "time": "08:00"}', TRUE),
('r2', 'user3', 'energy_check', '{"day": "Monday", "time": "18:00"}', TRUE);

INSERT INTO user_follows (id, follower_id, followed_id, created_at) VALUES
('uf1', 'user1', 'user3', '2023-10-05T12:00:00Z'),
('uf2', 'user3', 'user1', '2023-10-05T12:05:00Z');

INSERT INTO tip_ratings (id, user_id, tip_id, rating, created_at) VALUES
('tr1', 'user2', 't1', 4.5, '2023-10-05T14:00:00Z'),
('tr2', 'user3', 't2', 5.0, '2023-10-04T11:00:00Z');

INSERT INTO user_bookmarks (id, user_id, tip_id, impact_explanation_id, created_at) VALUES
('ub1', 'user1', 't2', NULL, '2023-10-05T15:00:00Z'),
('ub2', 'user3', NULL, 'ie1', '2023-10-04T10:30:00Z');
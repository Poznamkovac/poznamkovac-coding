CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

INSERT INTO users (name, email, password) VALUES ('John Doe', 'john@example.com', 'password123');
INSERT INTO users (name, email, password) VALUES ('Jane Smith', 'jane@example.com', 'password456');
INSERT INTO users (name, email, password) VALUES ('Alice Johnson', 'alice@example.com', 'password789');
INSERT INTO users (name, email, password) VALUES ('Bob Brown', 'bob@example.com', 'password101');
INSERT INTO users (name, email, password) VALUES ('Charlie Davis', 'charlie@example.com', 'password112');


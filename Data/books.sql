DROP TABLE IF EXISTS books;
CREATE TABLE books (
    id SERIAL NOT NULL,
    author VARCHAR(250),
    title VARCHAR(250),
    isbn VARCHAR(50),
    image_url VARCHAR(256),
    description TEXT
);
# SQLite Database Notebook

Learn SQL by working with a sample database.

## Setup Database

Create a sample database with student records:

```[readonly,mustExecute]
CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  grade REAL,
  major TEXT
);

INSERT INTO students (name, age, grade, major) VALUES
  ('Alice Johnson', 20, 3.8, 'Computer Science'),
  ('Bob Smith', 22, 3.5, 'Mathematics'),
  ('Charlie Brown', 21, 3.9, 'Physics'),
  ('Diana Prince', 23, 3.7, 'Computer Science'),
  ('Eve Wilson', 20, 3.6, 'Mathematics');

SELECT 'Database created successfully!' AS message;
```

## Basic SELECT

Retrieve all students:

```
SELECT * FROM students;
```

## Filtering Data

Find students with grade above 3.7:

```
SELECT name, grade, major
FROM students
WHERE grade > 3.7
ORDER BY grade DESC;
```

## Aggregation

Count students by major:

```
SELECT major, COUNT(*) as student_count, AVG(grade) as avg_grade
FROM students
GROUP BY major
ORDER BY student_count DESC;
```

## Advanced Query

Find Computer Science students with high grades:

```
SELECT name, age, grade
FROM students
WHERE major = 'Computer Science'
  AND grade >= 3.7
ORDER BY grade DESC;
```

## Statistics

Calculate overall statistics:

```
SELECT
  COUNT(*) as total_students,
  AVG(age) as average_age,
  AVG(grade) as average_grade,
  MIN(grade) as lowest_grade,
  MAX(grade) as highest_grade
FROM students;
```

## Summary

You've learned:

- Creating tables and inserting data
- SELECT queries with filtering
- Aggregation with GROUP BY
- Ordering and filtering results
- Statistical functions

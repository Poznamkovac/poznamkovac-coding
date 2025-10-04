-- Test file for SQL challenge
-- This would normally verify the query results
-- For now, just checking if the query runs

SELECT id, name, age
FROM students
WHERE age > 18
ORDER BY age DESC;

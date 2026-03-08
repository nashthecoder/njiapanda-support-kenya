-- Verify seed data inserted
SELECT name, type, zone FROM resources WHERE zone = 'Nairobi' LIMIT 10;
-- Check what columns actually exist in the table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'quote_email_tracking'
ORDER BY ordinal_position;

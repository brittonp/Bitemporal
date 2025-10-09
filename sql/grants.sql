-- This script assigns the bitemporal-api web app identity to roles which grants it access to read/write from/to tables, 
-- and execute functions/procs.

CREATE USER [bitemporal-api] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [bitemporal-api];
ALTER ROLE db_datawriter ADD MEMBER [bitemporal-api];
GRANT EXECUTE ON SCHEMA::btd TO [bitemporal-api];


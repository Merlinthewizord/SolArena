-- Add default DBC config address to existing teams
-- Update all teams to use the shared Meteora DBC config
update teams
set dbc_config_address = '2HUtAHdaWPZfsq4byuQTCDCF7q7zTfVKX8iFrYL6EJJC'
where dbc_config_address is null;

-- Add comment explaining the shared config
comment on column teams.dbc_config_address is 'Meteora DBC config address (shared across all teams): 2HUtAHdaWPZfsq4byuQTCDCF7q7zTfVKX8iFrYL6EJJC';

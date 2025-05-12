-- Add content planner assistant ID to app_config
INSERT INTO app_config (config_key, config_value, description)
VALUES 
  ('CONTENT_PLAN_ASSISTANT_ID', 'asst_zZapvx9hkA3KHnDLRR3B1e3W', 'OpenAI Assistant ID for the content planner')
ON CONFLICT (config_key) 
DO UPDATE SET 
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description;
  
-- NOTE: Replace 'asst_abc123def456ghi789jkl0' with your actual OpenAI Assistant ID
-- You can create a new assistant in the OpenAI platform specifically for content planning

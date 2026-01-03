-- Add google_config column to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS google_config JSONB DEFAULT '{}'::jsonb;

-- Add comment to explain the structure (not enforced by SQL but helpful for documentation)
COMMENT ON COLUMN organizations.google_config IS 'Stores Google OAuth tokens and settings: {accessToken, refreshToken, expiresAt, scope, selectedPropertyId, selectedSiteUrl}';

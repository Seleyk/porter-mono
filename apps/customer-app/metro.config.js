// Expo's default monorepo setup only watches the npm workspaces. @porter/shared
// re-exports the fare and booking-note code that lives with the edge functions
// (supabase/functions/_shared), so Metro has to see that folder too.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, "../../supabase/functions/_shared")];

module.exports = config;

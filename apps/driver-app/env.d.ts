declare const process: {
  env: {
    EXPO_PUBLIC_SUPABASE_URL: string;
    EXPO_PUBLIC_SUPABASE_KEY: string;
    EXPO_PUBLIC_MAPBOX_TOKEN: string;
    [key: string]: string | undefined;
  };
};

export const SUPABASE_URL = "https://nrtovlmelrwvezwhkdoh.supabase.co";
export const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydG92bG1lbHJ3dmV6d2hrZG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDU5NzEsImV4cCI6MjA5MzkyMTk3MX0.NpqNxYAdNZbI0L4EhluXnyAmUjlP5YECUZaK-2MQGvQ";

export const sbHeaders = (token) => ({
  apikey: SUPABASE_ANON,
  Authorization: `Bearer ${token || SUPABASE_ANON}`,
  "Content-Type": "application/json",
});

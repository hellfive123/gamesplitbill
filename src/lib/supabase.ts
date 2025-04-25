
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use the specific client from our integrated Supabase setup
import { supabase as integratedClient } from "@/integrations/supabase/client";

// Export the integrated client directly, which is already properly configured
export const supabase = integratedClient;

// Always return true to indicate Supabase is configured
export const isSupabaseConfigured = () => true;

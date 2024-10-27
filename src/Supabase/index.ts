import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

// Create a single supabase client for interacting with your database
const supabase = createClient<Database>(
    import.meta.env.VITE_APP_SUPABASE_URL!,
    import.meta.env.VITE_APP_SUPABASE_KEY!
);

export default supabase;

import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database.js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_KEY environment variable");
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default supabase;

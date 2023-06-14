import { Database } from "../types/supabase";
//import { Brand } from "./brand";
//import { season } from "./seasons";

//export type series_id = Brand<number, "series_id">;
export type series = Database["public"]["Tables"]["series"]["Row"];

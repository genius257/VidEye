import { Database } from "../types/supabase";
//import { Brand } from "./brand";
//import { episode } from "./episodes";
//import { series, series_id } from "./series";

//export type season_id = Brand<number, "season_id">;
export type season = Database["public"]["Tables"]["seasons"]["Row"];

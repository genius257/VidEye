import { Database } from "../types/supabase";
//import { Brand } from "./brand";
//import { season, season_id } from "./seasons";
//import { video, video_id } from "./videos";

//export type episode_id = Brand<number, "episode_id">;
export type episode = Database["public"]["Tables"]["episodes"]["Row"];

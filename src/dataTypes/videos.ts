import { Database } from "../types/supabase";
//import { Brand } from "./brand";
//import { episode } from "./episodes";

//export type video_id = Brand<number, "video_id">;
export type video = Database["public"]["Tables"]["videos"]["Row"];

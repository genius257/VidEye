import { Brand } from "./brand";
import { episode } from "./episodes";

export type video_id = Brand<number, "video_id">;
export type video = {
    id: video_id;
    ytid: string;
    created_at: number;
    start_at: number | null;
    end_at: number | null;
    episodes?: Array<episode> | null;
};

import { Brand } from "./brand";
import { season, season_id } from "./seasons";
import { video, video_id } from "./videos";

export type episode_id = Brand<number, "episode_id">;
export type episode = {
    id: episode_id;
    title: string;
    video_id: video_id;
    created_at: number;
    episode: number;
    season_id: season_id;
    videos?: video | null;
    seasons?: Array<season> | null;
};

import { Brand } from "./brand";
import { season } from "./seasons";

export type series_id = Brand<number, "series_id">;
export type series = {
    id: series_id;
    title: string;
    created_at: number;
    tmdb_id: string | null;
    poster: string | null;
    seasons?: Array<season> | null;
};

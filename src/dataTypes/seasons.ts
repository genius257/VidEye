import { Brand } from "./brand";
import { episode } from "./episodes";
import { series_id } from "./series";

export type season_id = Brand<number, "season_id">;
export type season = {
    id: season_id;
    series_id: series_id;
    poster: string;
    created_at: number;
    title: string;
    episodes?: Array<episode> | null;
    series?: Array<series_id> | null;
};

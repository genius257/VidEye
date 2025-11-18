import { Models } from "appwrite";
import { WithoutIndexSignature } from "./utils";


export interface Movie extends WithoutIndexSignature<Models.Document> {
    title: string;
    created_at: Datetime;
    updated_at: Datetime;
    deleted_at: Datetime;
    poster: Url;
    video: Video;
    tmdb_id: string;
}

export type Datetime = string;//FIXME

export interface Series extends WithoutIndexSignature<Models.Document> {
    title: string;
    created_at: Datetime;
    tmdb_id: string;
    seasons?: Array<Season>;
    poster: string;
}

export type Url = string;//FIXME

export interface Season extends WithoutIndexSignature<Models.Document> {
    series: Series;
    poster: Url;
    created_at: Datetime;
    title: string;
    episodes?: Array<Episode>;
    season: Integer;
}

export type Integer = number;//FIXME

export interface Episode extends WithoutIndexSignature<Models.Document> {
    title: string;
    season: Season;
    video: Video;
    created_at: Datetime;
    episode: Integer;
}

export type Double = number;//FIXME

export interface Video extends WithoutIndexSignature<Models.Document> {
    ytid: string,
    created_at: Datetime,
    start_at: Double,
    end_at: Double,
    duration: Double,
    movies: Array<Movie>,
    history: Array<History>,
    episode: Array<Episode>,
}

export interface History extends WithoutIndexSignature<Models.Document> {
    user_id: string;
    video: Video;
    time: Double;
    created_at: Datetime;
    updated_at: Datetime;
    deleted_at: Datetime;
}

import { tmdb } from "@/tmdb";
import { Series, Movie } from "@/types/models";
import Video from "@/views/video";
import { HTMLProps, useEffect, useState } from "react";
import { MovieDetails, SeasonDetails, TvShowDetails } from "tmdb-ts";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { databaseIds, databases } from "@/appwrite";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Cross, Plus, X } from "lucide-react";

type VideoType = "movie" | "series";

export type VideoEntry = {
    ytid: string;
    url: string;
    title: string;
    type: VideoType;
    series?: Series;
    season?: string;
    episode?: string;
    duration?: number;
    start?: number;
    end?: number;
};

export type ViewentryFieldProps = {
    ytid: string;
    onValueChange?: (value: VideoEntry) => void;
} & HTMLProps<HTMLDivElement>;

export default function ViewentryField({
    ytid,
    onValueChange,
    ...props
}: ViewentryFieldProps) {
    const [videoInfo, setVideoInfo] = useState<Partial<VideoEntry>>({
        title: "",
        ytid,
        type: "movie",
    });
    const [series, setSeries] = useState<Series[]>([]);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [seriesData, setSeriesData] = useState<TvShowDetails | null>(null);
    const [seasonData, setSeasonData] = useState<SeasonDetails | null>(null);
    const [movieData, setMovieData] = useState<MovieDetails | null>(null);

    useEffect(() => {
        if (onValueChange) {
            onValueChange(videoInfo as VideoEntry);
        }
    }, [videoInfo]);

    useEffect(() => {
        //fetch series and movies
        switch (videoInfo.type) {
            case "series":
                databases
                    .listDocuments("671eb9f3000ca1862380", databaseIds.series)
                    .then((response) =>
                        setSeries(response.documents as Series[]),
                    );
                break;
            case "movie":
                databases
                    .listDocuments("671eb9f3000ca1862380", databaseIds.movies)
                    .then((response) =>
                        setMovies(response.documents as Movie[]),
                    );
                break;
        }
    }, [videoInfo.type]);

    /*
    useEffect(() => {
        //fetch video info
        fetchVideoInfo(`https://www.youtube.com/watch?v=${ytid}`).then((info) =>
            setVideoInfo(info)
        );
    }, [ytid]);
    */

    useEffect(() => {
        if (videoInfo.series?.tmdb_id === undefined) return;
        tmdb.tvShows
            .details(parseInt(videoInfo.series?.tmdb_id))
            .then((response) => {
                setSeriesData(response);
            });
    }, [videoInfo.series?.tmdb_id]);

    useEffect(() => {
        if (videoInfo.series?.tmdb_id === undefined) return;
        if (videoInfo.season === undefined) return;

        tmdb.tvSeasons
            .details({
                seasonNumber: parseInt(videoInfo.season),
                tvShowID: parseInt(videoInfo.series?.tmdb_id),
            })
            .then((response) => {
                setSeasonData(response);
            });
    }, [videoInfo.season]);

    return (
        <div {...props}>
            <Video
                autoplay={false}
                controls
                disablekb
                modestbranding
                origin="http://localhost"
                VIDEO_ID={ytid}
                className="w-full"
                yt={{
                    onReady(event) {
                        setVideoInfo({
                            ...videoInfo,
                            duration: event.target.getDuration(),
                        });
                    },
                }}
            />
            {videoInfo.series?.tmdb_id === undefined && (
                <Input
                    value={videoInfo.title}
                    onChange={(e) =>
                        setVideoInfo({ ...videoInfo, title: e.target.value })
                    }
                    placeholder="Video Title"
                />
            )}
            <RadioGroup
                value={videoInfo.type}
                onValueChange={(value: VideoType) =>
                    setVideoInfo({ ...videoInfo, type: value })
                }
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="movie" />
                    <Label>Movie</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="series" />
                    <Label>Series</Label>
                </div>
            </RadioGroup>
            {videoInfo.type === "series" && (
                <div className="space-y-2">
                    <Select
                        value={videoInfo.series?.$id}
                        onValueChange={(value) =>
                            setVideoInfo({
                                ...videoInfo,
                                series: series.find((s) => s.$id === value),
                                season: undefined,
                                episode: undefined,
                            })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Series" />
                        </SelectTrigger>
                        <SelectContent>
                            {series.map((s) => (
                                <SelectItem key={s.$id} value={s.$id}>
                                    {s.title}
                                </SelectItem>
                            ))}
                            <SelectItem value="__new__">
                                + Add New Series
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    {/*entry.series?.title === "__new__" && (
                                    <Input
                                        placeholder="New Series Name"
                                        onChange={(e) =>
                                            updateEntry(index, {
                                                series: e.target.value
                                            })
                                        }
                                    />
                                )*/}
                    <div className="flex space-x-2">
                        <Select
                            disabled={videoInfo.series === undefined}
                            value={videoInfo.season ?? ""}
                            onValueChange={(e) =>
                                setVideoInfo({
                                    ...videoInfo,
                                    season: e,
                                    episode: undefined,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Season" />
                            </SelectTrigger>
                            <SelectContent>
                                {seriesData?.seasons?.map((s) => (
                                    <SelectItem
                                        key={s.id}
                                        value={s.season_number.toString()}
                                    >
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            disabled={videoInfo.season === undefined}
                            value={videoInfo.episode ?? ""}
                            onValueChange={(e) => {
                                setVideoInfo({
                                    ...videoInfo,
                                    episode: e,
                                    title:
                                        seasonData?.episodes?.find(
                                            (s) =>
                                                s.episode_number.toString() ===
                                                e,
                                        )?.name ?? "",
                                });
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Episode" />
                            </SelectTrigger>
                            <SelectContent>
                                {seasonData?.episodes?.map((s) => (
                                    <SelectItem
                                        key={s.id}
                                        value={s.episode_number.toString()}
                                    >
                                        S
                                        {s.season_number
                                            .toString()
                                            .padStart(2, "0")}
                                        E
                                        {s.episode_number
                                            .toString()
                                            .padStart(2, "0")}
                                        : {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
        </div>
    );
}

import { tmdb } from "@/tmdb";
import { Series, Movie } from "@/types/models";
import Video from "@/views/video";
import { HTMLProps, useEffect, useMemo, useState } from "react";
import {
    /*MovieDetails,*/ SeasonDetails,
    TV,
    TvShowDetails,
    Movie as TmdbMovie,
} from "tmdb-ts";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { collectionIds, databases } from "@/appwrite";
import { Input } from "./ui/input";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "./ui/command";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { useQuery } from "@tanstack/react-query";
import { ID, Query } from "appwrite";
import { useDebounce } from "@uidotdev/usehooks";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";

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
    value?: VideoEntry;
} & Omit<HTMLProps<HTMLDivElement>, "value">;

export default function ViewentryField({
    ytid,
    onValueChange,
    value,
    ...props
}: ViewentryFieldProps) {
    const [videoInfo, setVideoInfo] = useState<Partial<VideoEntry>>({
        title: value?.title ?? "",
        ytid,
        type: "movie",
    });
    const [series, setSeries] = useState<Series[]>([]);
    const [, /*movies*/ setMovies] = useState<Movie[]>([]);
    const [seriesData, setSeriesData] = useState<TvShowDetails | null>(null);
    const [seasonData, setSeasonData] = useState<SeasonDetails | null>(null);
    // const [movieData, setMovieData] = useState<MovieDetails | null>(null);
    const [isTmdbModalOpen, setTmdbModalOpen] = useState(false);
    const [tmdbSearchQuery, setTmdbSearchQuery] = useState("");
    const [isSeriesDropdownVisible, setSeriesDropdownVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const debouncedSearchTerm = useDebounce(searchQuery, 300);
    const searchQueryResult = useQuery({
        queryKey: [
            "contentSectionSearch",
            videoInfo.type,
            debouncedSearchTerm,
            isSeriesDropdownVisible,
        ],
        refetchOnWindowFocus: false,
        queryFn: () => {
            if (videoInfo.type === undefined || !isSeriesDropdownVisible) {
                return [];
            }

            const collectionId =
                videoInfo.type === "movie"
                    ? collectionIds.movies
                    : collectionIds.series;

            return databases
                .listDocuments<Series | Movie>(
                    "671eb9f3000ca1862380",
                    collectionId,
                    [
                        Query.limit(10),
                        ...(debouncedSearchTerm.trim() !== ""
                            ? [Query.contains("title", debouncedSearchTerm)]
                            : []),
                    ],
                )
                .then((response) => response.documents);
        },
    });

    const debouncedTmdbSearchQuery = useDebounce(tmdbSearchQuery, 300);
    const tmdbQueryResult = useQuery({
        queryKey: ["TMDB search", videoInfo.type, debouncedTmdbSearchQuery],
        refetchOnReconnect: false,
        queryFn: () => {
            if (videoInfo.type === undefined) {
                return [];
            }

            return tmdb.search[
                videoInfo.type === "movie" ? "movies" : "tvShows"
            ]({
                query: debouncedTmdbSearchQuery,
                include_adult: true,
            }).then((response) => response.results);
        },
    });
    const addSeriesFromTMDB = (value: TmdbMovie | TV) => {
        if (videoInfo.type === undefined) {
            return;
        }
        //Create new db entry
        databases
            .createDocument(
                "671eb9f3000ca1862380",
                videoInfo.type === "movie"
                    ? collectionIds.movies
                    : collectionIds.series,
                ID.unique(),
                videoInfo.type === "movie"
                    ? ({
                          title: (value as TmdbMovie).title,
                          tmdb_id: value.id.toString(),
                          poster: value.poster_path,
                          created_at: "",
                      } satisfies Partial<Movie>)
                    : ({
                          title: (value as TV).name,
                          tmdb_id: value.id.toString(),
                          poster: value.poster_path,
                          created_at: "",
                      } satisfies Partial<Series>),
            )
            .then((result) => {
                //FIXME: currently this does not handle movie creation!
                setVideoInfo({
                    ...videoInfo,
                    series: result as Series,
                    season: undefined,
                    episode: undefined,
                });
            });

        setTmdbModalOpen(false);
        setTmdbSearchQuery("");
        setSeriesDropdownVisible(false);
    };

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
                    .listDocuments("671eb9f3000ca1862380", collectionIds.series)
                    .then((response) =>
                        setSeries(response.documents as Series[]),
                    );
                break;
            case "movie":
                databases
                    .listDocuments("671eb9f3000ca1862380", collectionIds.movies)
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
                    <Popover
                        open={isSeriesDropdownVisible}
                        onOpenChange={(open) => setSeriesDropdownVisible(open)}
                    >
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isSeriesDropdownVisible}
                                className="justify-between w-full"
                            >
                                {videoInfo.series?.title ?? "Select series..."}
                                <ChevronsUpDown className="opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                            <Command>
                                <CommandInput
                                    placeholder="Search series..."
                                    value={searchQuery}
                                    onValueChange={(value) =>
                                        setSearchQuery(value)
                                    }
                                />
                                <CommandList>
                                    <CommandEmpty>
                                        <div className="p-2 text-center text-sm">
                                            <p className="text-muted-foreground mb-2">
                                                No series found
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setTmdbModalOpen(true);
                                                    setSeriesDropdownVisible(
                                                        false,
                                                    );
                                                }}
                                                className="w-full"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add new series from TMDB
                                            </Button>
                                        </div>
                                    </CommandEmpty>
                                    <CommandGroup>
                                        {searchQueryResult.data?.map((s) => (
                                            <CommandItem
                                                key={s.$id}
                                                value={s.title}
                                                onSelect={() => {
                                                    setSeriesDropdownVisible(
                                                        false,
                                                    );
                                                    setVideoInfo({
                                                        ...videoInfo,
                                                        series: series.find(
                                                            (_s) =>
                                                                s.$id ===
                                                                _s.$id,
                                                        ),
                                                        season: undefined,
                                                        episode: undefined,
                                                    });
                                                }}
                                            >
                                                {videoInfo.series?.$id ===
                                                    s.$id && <Check />}
                                                {s.title}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
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
            <Dialog open={isTmdbModalOpen} onOpenChange={setTmdbModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Search TheMovieDB</DialogTitle>
                        <DialogDescription>
                            Search for a {videoInfo.type} to add to your
                            platform
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder="Search for series..."
                            value={tmdbSearchQuery}
                            onChange={(e) => setTmdbSearchQuery(e.target.value)}
                        />
                        {tmdbQueryResult.isLoading && (
                            <div className="text-center py-8 text-muted-foreground">
                                Searching...
                            </div>
                        )}
                        {!tmdbQueryResult.isLoading &&
                            (tmdbQueryResult.data?.length ?? 0) === 0 &&
                            tmdbSearchQuery && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No results found
                                </div>
                            )}
                        {!tmdbQueryResult.isLoading &&
                            (tmdbQueryResult.data?.length ?? 0) > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {tmdbQueryResult.data?.map((result) => {
                                        const title =
                                            "name" in result
                                                ? result.name
                                                : result.title;
                                        const date =
                                            "release_date" in result
                                                ? result.release_date
                                                : result.first_air_date;
                                        return (
                                            <button
                                                key={result.id}
                                                onClick={() =>
                                                    addSeriesFromTMDB(result)
                                                }
                                                className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
                                            >
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w300/${
                                                        result.poster_path ||
                                                        "/placeholder.svg"
                                                    }`}
                                                    alt={title}
                                                    className="w-full aspect-[2/3] object-cover rounded-md"
                                                />
                                                <div className="text-center">
                                                    <p className="text-sm font-medium line-clamp-2">
                                                        {title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {date !== ""
                                                            ? new Date(
                                                                  date,
                                                              ).getFullYear()
                                                            : null}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

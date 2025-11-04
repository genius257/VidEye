import React, { useState } from "react";
import { collectionIds, databases } from "../appwrite";
import { ID } from "appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Episode, Series } from "@/types/models";
import ViewentryField from "@/components/ViewentryField";
import { X } from "lucide-react";
import { useUser } from "@/appwrite/context/user";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";

type VideoType = "movie" | "series";

type VideoEntry = {
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

const parseUrls = (input: string) => {
    const urlRegex =
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?([^&\n?#]+)/g;
    return Array.from(input.matchAll(urlRegex), (m) => ({
        url: m[0]!,
        id: m[1]!,
    }));
};

const fetchVideoInfo = async (url: string): Promise<Partial<VideoEntry>> => {
    //fetch(`https://www.googleapis.com/youtube/v3/videos?id=${url}&part=snippet&key=${import.meta.env.VITE_APP_GOOGLE_CLOUD_API_KEY}`);
    return fetch(`https://noembed.com/embed?url=${url}`)
        .then((response) => response.json())
        .then((data) => {
            return { title: data?.title };
        });
};

export default function Me() {
    const [urls, setUrls] = useState("");
    const [videoEntries, setVideoEntries] = useState<VideoEntry[]>([]);
    const user = useUser();
    const [email, setEmail] = useState<string>("");
    const [otp, setOtp] = useState<string>("");

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const parsedUrls = parseUrls(urls);
        const newEntries: VideoEntry[] = [];

        Promise.all(
            parsedUrls.map((oUrl) =>
                fetchVideoInfo(oUrl.url).then((info) => {
                    newEntries.push({
                        ytid: oUrl.id,
                        url: oUrl.url,
                        title: info.title ?? "Unknown",
                        type: "movie", // Default to movie
                    });
                }),
            ),
        ).then(() => {
            setVideoEntries([...videoEntries, ...newEntries]);
            setUrls("");
        });
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            {user?.current ? (
                "current user"
            ) : user?.token === null ? (
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        user.createEmailToken(email);
                    }}
                >
                    <Input
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button type="submit" className="w-full">
                        Login
                    </Button>
                </form>
            ) : (
                <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                        setOtp(e);
                        if (e.length === 6) {
                            user?.createSession(e);
                        }
                    }}
                >
                    <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                    </InputOTPGroup>
                </InputOTP>
            )}

            <h1 className="text-2xl font-bold mb-4">Add Videos</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label>YouTube URLs (one per line)</Label>
                    <Textarea
                        value={urls}
                        onChange={(event) => setUrls(event.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        rows={5}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={urls === ""}>
                    Add Videos
                </Button>
            </form>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    videoEntries.forEach((entry) => {
                        databases.createDocument(
                            "671eb9f3000ca1862380",
                            collectionIds.episodes,
                            ID.unique(),
                            {
                                episode:
                                    entry.episode !== undefined
                                        ? parseInt(entry.episode)
                                        : undefined,
                                title: entry.title,
                                created_at: "",
                                // @ts-expect-error Currently the type is not finalized, and is cuzrrently using the response type isntead of the more dynamic upsert type
                                video: {
                                    ytid: entry.ytid,
                                    duration: entry.duration!,
                                    created_at: "",
                                    start_at: 0,
                                    end_at: 0,
                                },
                                season: entry.series?.seasons?.find(
                                    (season) =>
                                        season.season ===
                                        parseInt(entry.season!),
                                ),
                            } satisfies Partial<Episode>,
                        );
                    });
                }}
            >
                <div className="mt-8 space-y-6">
                    {videoEntries.map((entry, index) => (
                        <div className="border p-4 rounded-md space-y-4">
                            <div className="flex space-x-2 justify-end">
                                <Button
                                    size={"icon"}
                                    className="w-10 h-10"
                                    onClick={() =>
                                        setVideoEntries(
                                            videoEntries.filter(
                                                (_, i) => i !== index,
                                            ),
                                        )
                                    }
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <ViewentryField
                                ytid={entry.ytid}
                                key={index}
                                className="space-y-4"
                                onValueChange={(value) => {
                                    setVideoEntries(
                                        videoEntries.toSpliced(index, 1, value),
                                    );
                                }}
                            />
                        </div>
                    ))}
                </div>
                <Button
                    type="submit"
                    className="w-full mt-4"
                    disabled={videoEntries.length === 0}
                >
                    Save
                </Button>
            </form>
        </div>
    );
}

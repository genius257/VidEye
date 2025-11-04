import { useEffect, useState } from "react";
import Video from "./video";
import { databases } from "../appwrite";
import { Query } from "appwrite";
import { useParams } from "react-router-dom";

const databaseId = "671eb9f3000ca1862380";

const collectionIds = {
    series: "671ec7fb000b3517b7e6",
    movies: "671ec5e1002943b28df8",
    history: "671eca420003af618870",
};

function getMovie(id: string) {
    return databases
        .listDocuments(databaseId, collectionIds.movies, [
            Query.equal("id", id),
            Query.limit(1),
        ])
        .then((response) => response.documents?.[0]);
}

export default function Series() {
    const [play, setPlay] = useState(false);
    const [movie, setMovie] = useState<Awaited<ReturnType<typeof getMovie>>>();
    const { id } = useParams<{ id: string }>();

    useEffect(() => {
        if (id === undefined) {
            return;
        }

        getMovie(id).then((result) => setMovie(result));
    }, [id]);

    const video = [movie?.videos ?? []].flat()[0];

    return play ? (
        <Video VIDEO_ID={video?.ytid} />
    ) : (
        <button onClick={() => setPlay(true)}>Play</button>
    );
}

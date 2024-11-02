import Poster from "./Poster";

export default function TmdbPoster({ image }: { image: string }) {
    return <Poster image={`https://image.tmdb.org/t/p/w300/${image.trim()}`} />;
}

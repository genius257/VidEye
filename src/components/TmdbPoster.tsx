import { ComponentProps } from "react";
import Poster from "./Poster";

type Props = ComponentProps<typeof Poster> & { image?: string };

export default function TmdbPoster({ image, ...props }: Props) {
    return (
        <Poster
            image={
                image !== undefined
                    ? `url('https://image.tmdb.org/t/p/w300/${image.trim()}')`
                    : undefined
            }
            {...props}
        />
    );
}

import { TMDB } from 'tmdb-ts';

export const tmdb = new TMDB(import.meta.env.VITE_APP_TMDB_API_KEY);

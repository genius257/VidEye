import { Account, Client, Databases } from "appwrite";

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APP_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APP_APPWRITE_PROJECT_ID);

const account = new Account(client);

const databases = new Databases(client);

const databaseIds = {
    series: "671ec7fb000b3517b7e6",
    seasons: "671ecb800036fac028e0",
    movies: "671ec5e1002943b28df8",
    history: "671eca420003af618870",
    episodes: "671ec5a900219da44149",
};

export {
    client,
    account,
    databases,
    databaseIds,
};

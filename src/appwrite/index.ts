import { Account, Client, Databases } from "appwrite";

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APP_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APP_APPWRITE_PROJECT_ID);

const account = new Account(client);

const databases = new Databases(client);

export {
    client,
    account,
    databases,
};
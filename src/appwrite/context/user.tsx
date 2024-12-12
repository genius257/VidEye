import {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useState
} from "react";
import { account } from "..";
import { ID, Models } from "appwrite";

const UserContext = createContext<{
    current: Models.Session | Models.User<Models.Preferences> | null;
    token: Models.Token | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    createEmailToken: (email: string) => Promise<Models.Token>;
    createSession: (secret: string) => Promise<Models.Session>;
} | null>(null);

export function useUser() {
    return useContext(UserContext);
}

export function UserProvider(props: PropsWithChildren) {
    const [user, setUser] = useState<
        Models.Session | Models.User<Models.Preferences> | null
    >(null);

    const [token, setToken] = useState<Models.Token | null>(null);

    async function login(email: string, password: string) {
        const loggedIn = await account.createEmailPasswordSession(
            email,
            password
        );
        setUser(loggedIn);
        window.location.replace("/"); // you can use different redirect method for your application
    }

    async function logout() {
        await account.deleteSession("current");
        setUser(null);
    }

    async function register(email: string, password: string) {
        await account.create(ID.unique(), email, password);
        await login(email, password);
    }

    async function createEmailToken(email: string) {
        return await account.createEmailToken(ID.unique(), email).then(
            (value) => {
                setToken(value);
                return value;
            },
            (reason) => {
                throw new Error(reason.message); //FIXME: handle error
            }
        );
    }

    async function createSession(secret: string) {
        if (token == null) {
            throw new Error("No token found");
        }
        return await account.createSession(token?.userId, secret).then(
            (value) => {
                setUser(value);
                return value;
            },
            (reason) => {
                throw new Error(reason.message); //FIXME: handle error
            }
        );
    }

    async function init() {
        try {
            const loggedIn = await account.get();
            setUser(loggedIn);
        } catch (err) {
            setUser(null);
        }
    }

    useEffect(() => {
        init();
    }, []);

    return (
        <UserContext.Provider
            value={{
                current: user,
                token,
                login,
                logout,
                register,
                createEmailToken,
                createSession
            }}
        >
            {props.children}
        </UserContext.Provider>
    );
}

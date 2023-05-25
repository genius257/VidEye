import supabase from ".";

supabase.auth.onAuthStateChange((event, session) => {
    //FIXME: store entire session in Supabase class?
    Supabase.uid = session?.user.id ?? null;
});

export default class Supabase {
    static uid: string | null = null;

    static isSignedIn() {
        return this.uid !== null;
    }

    static signOut() {
        supabase.auth
            .signOut()
            .then(() => {
                // Sign-out successful.
            })
            .catch((error) => {
                // An error happened.
            });
    }
}

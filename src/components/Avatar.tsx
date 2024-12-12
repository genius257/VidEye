import md5 from "blueimp-md5";
import { Component, useEffect, useState } from "react";
import "./Avatar.css";
import { useUser } from "@/appwrite/context/user";
import { account } from "@/appwrite";

export default function Avatar() {
    const user = useUser();
    const [photoURL, setPhotoURL] = useState(
        "https://www.gravatar.com/avatar/"
    );
    const [displayName, setDisplayName] = useState("Anonymous");
    useEffect(() => {
        if (user?.current == null) {
            setPhotoURL("https://www.gravatar.com/avatar/");
            setDisplayName("Anonymous");
        }

        account.get().then((value) => {
            const email = value.email;
            const hash =
                email == null
                    ? "00000000000000000000000000000000"
                    : md5(email.trim().toLowerCase());
            setPhotoURL(`https://www.gravatar.com/avatar/${hash}`);
            setDisplayName(value.name);
        });
    }, [user?.current]);

    return (
        <div
            className="avatar"
            style={{ backgroundImage: `url(${photoURL})` }}
            title={displayName}
        />
    );
}

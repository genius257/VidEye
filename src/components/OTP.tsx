import React from "react";
import "./OTP.scss";

export default class OTP extends React.Component<{}, { email: string | null }> {
    state = {
        email: null
    };

    render(): React.ReactNode {
        return (
            <div className="otp">
                <div className="navigation">
                    <div
                        className={
                            this.state.email == null ? "step active" : "step"
                        }
                    >
                        Email
                    </div>
                    <div
                        className={
                            this.state.email == null
                                ? "step disabled"
                                : "step active"
                        }
                    >
                        Code
                    </div>
                </div>
                {this.state.email == null ? (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            const form = event.target;
                            const formData = new FormData(
                                form as HTMLFormElement
                            );
                            this.setState({
                                email: formData.get("email") as string
                            });
                            (form as HTMLFormElement).reset();
                        }}
                    >
                        <input type="email" name="email" placeholder="Email" />
                        <input type="submit" value="Send" />
                    </form>
                ) : (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            const form = event.target;
                            const formData = new FormData(
                                form as HTMLFormElement
                            );
                            this.setState({
                                email: formData.get("email") as string
                            });
                            (form as HTMLFormElement).reset();
                        }}
                    >
                        <input
                            type="text"
                            name="otp"
                            placeholder="One time password"
                        />
                        <input type="submit" value="Login" />
                    </form>
                )}
            </div>
        );
    }
}

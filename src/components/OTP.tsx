import { Component, ReactNode } from "react";
import "./OTP.scss";

type OtpProps = {
    onMail?: (email: string) => Promise<boolean>;
    onCode?: (code: string) => Promise<boolean>;
};
type OtpState = { email: string | null };

export default class OTP extends Component<OtpProps, OtpState> {
    state = {
        email: null
    };

    render(): ReactNode {
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
                            const form = event.currentTarget;
                            const formData = new FormData(form);

                            const email = formData.get("email") as string;

                            const promise =
                                this.props.onMail?.(email) ??
                                Promise.resolve(true);

                            promise.then((success) => {
                                if (success) {
                                    this.setState({
                                        email: formData.get("email") as string
                                    });

                                    form.reset();
                                } else {
                                    //TODO: show validation error message
                                }
                            });
                        }}
                    >
                        <input type="email" name="email" placeholder="Email" />
                        <input type="submit" value="Send" />
                    </form>
                ) : (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            const form = event.currentTarget;
                            const formData = new FormData(form);
                            const otp = formData.get("otp") as string;

                            const promise =
                                this.props.onCode?.(otp) ??
                                Promise.resolve(true);

                            promise.then((success) => {
                                if (success) {
                                    this.setState({
                                        email: formData.get("otp") as string
                                    });
                                    form.reset();
                                } else {
                                    //TODO: show validation error message
                                }
                            });
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

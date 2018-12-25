import * as React from "react";
import { MouseEvent } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import Dropzone, { DropzoneRenderArgs } from "react-dropzone";
import "./App.css";

type AppState = { link?: string; error?: string; copy?: boolean };

class App extends React.Component<{}, AppState> {
    state: AppState = {};
    file: File | null = null;

    onPaste = (e: ClipboardEvent) => {
        if (!e.type.includes("paste")) {
            return;
        }

        const [file] = Array.from(e.clipboardData.files);

        if (file) {
            this.file = file;
            this.submitFile();
        }
    };

    componentDidMount() {
        if (!document.cookie.includes("koa:sess")) {
            document.location.href = "/auth/google";
        }

        document.addEventListener("paste", this.onPaste);
    }

    render() {
        return (
            <Dropzone
                onDrop={e => {
                    e[0] && (this.file = e[0]);

                    this.submitFile();
                }}
            >
                {(dz: DropzoneRenderArgs) => (
                    <div className="App">
                        <div
                            {...dz.getRootProps()}
                            className="App-form"
                            style={{
                                backgroundColor: dz.isDragActive
                                    ? "#444"
                                    : undefined,
                            }}
                        >
                            {this.state.link ? (
                                <CopyToClipboard
                                    text={this.state.link}
                                    onCopy={() => {
                                        this.setState({
                                            copy: true,
                                        });
                                    }}
                                >
                                    <div
                                        className="App-link"
                                        style={{
                                            color: this.state.copy
                                                ? "#53da91"
                                                : undefined,
                                        }}
                                    >
                                        {this.state.link}
                                    </div>
                                </CopyToClipboard>
                            ) : (
                                <form onSubmit={this.onSubmitForm}>
                                    <div>
                                        {this.state.error ? (
                                            <span style={{ color: "#ee0000" }}>
                                                {this.state.error}
                                            </span>
                                        ) : (
                                            <span>
                                                Drag file or click here.
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        {...dz.getInputProps()}
                                        type="file"
                                        accept="image/jpg, image/png, image/jpeg, image/webp"
                                        name="image"
                                    />
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </Dropzone>
        );
    }

    submitFile = async () => {
        const formData = new FormData();

        if (this.file == null) {
            return;
        }

        formData.append("image", this.file);

        const response = await fetch("/upload", {
            method: "POST",
            credentials: "include",
            body: formData,
        });

        const jsonResponse: {
            error?: string;
            link?: string;
        } = await response.json();

        if (jsonResponse.error) {
            this.setState({
                error: jsonResponse.error,
            });
        } else {
            this.setState({
                link: jsonResponse.link,
            });
        }
    };

    private onSubmitForm = (e: React.FormEvent<HTMLFormElement>) =>
        e.preventDefault();
}

export default App;

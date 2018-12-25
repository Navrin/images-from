const settings: Settings = require("../settings.json");

if (settings === undefined) {
    throw new Error(
        "settings.json does not exist! Please make a settings.json that conforms to the example.",
    );
}

interface Settings {
    endpoint: string;
    volume: string;
    google: {
        id: string;
        secret: string;
        allowedUsers: string[];
    };
    secret: string;
    build: string;
}

export default settings;

import App, { Context } from "koa";
import Router from "koa-router";
import bodyParser from "koa-body";
import createStatic from "koa-static";
import session from "koa-session";
import mount from "koa-mount";

import uuid from "uuid/v4";

import "./auth";
import settings from "./settings";

import imagemin from "imagemin";
import fs from "fs";
import path, { resolve } from "path";
import koaPassport from "koa-passport";
import { Profile } from "passport-google-oauth";

const resolvePath = require("resolve-path");

const app = new App();
const router = new Router();

app.keys = [settings.secret];

app.use(
    session(
        {
            httpOnly: false,
            renew: true,
        },
        app,
    ),
);
app.use(createStatic(settings.volume));
app.use(koaPassport.initialize());
app.use(koaPassport.session());
// app.use(mount("/static", createStatic(settings.build + "/static")));
app.use(createStatic(settings.build));

router
    .get(
        "/auth/google",
        koaPassport.authenticate("google", {
            scope: ["email"],
        }),
    )
    .get(
        "/auth/google/callback",
        koaPassport.authenticate("google", {
            successRedirect: "/upload",
            failureRedirect: "/err",
        }),
    )
    .get("/err", async ctx => {
        ctx.body = "Something went wrong.";
    })
    .get(`/images/:f`, async ctx => {
        ctx.response.set("Content-Type", "image/png");
        ctx.body = await fs.promises.readFile(
            resolvePath(settings.volume, ctx.params.f),
        );
    })
    .post("/upload", bodyParser({ multipart: true }), async ctx => {
        ctx.type = "application/json";

        ctx.assert(
            ctx.is("multipart/*"),
            415,
            JSON.stringify({ error: "Only images can be uploaded." }),
        );
        ctx.assert(
            ctx.isAuthenticated(),
            403,
            JSON.stringify({ error: "Not authenticated" }),
        );
        ctx.assert(
            ctx.request.files && ctx.request.files.image,
            400,
            JSON.stringify({ error: "Missing image field in upload." }),
        );

        const user: Profile = ctx.state.user;

        ctx.assert(
            user
                .emails!.map(e => e.value)
                .find(name => settings.google.allowedUsers.includes(name)),
            403,
            JSON.stringify({ error: "Not a permitted user." }),
        );

        const { path: imagePath, name: imageName } = ctx.request.files!.image;
        const ext = path.extname(imageName);

        const [output] = await imagemin([imagePath], settings.volume, {
            plugins: [require("imagemin-pngquant")({ quality: 80 })],
        });

        const id = uuid();

        const name = `${id}${ext}`;
        const file = `${settings.endpoint}images${name}`;

        await fs.promises.rename(
            output.path,
            resolvePath(settings.volume, name),
        );

        ctx.body = { link: file };
    })
    .get("/*", async ctx => {
        ctx.type = "html";
        ctx.body = await fs.promises.readFile(settings.build + "index.html");
    });

app.use(router.routes());

console.log(`
Starting up Koa server on port 80.
`);
app.listen(80);

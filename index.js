import puppeteer from "puppeteer";
import fetch from "node-fetch";
import fs from "fs";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";

(async () => {
  dotenv.config();

  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const DISCORD_PROFILE_ID = process.env.DISCORD_PROFILE_ID;

  const browser = await puppeteer.launch({
    userDataDir: "./userData",
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized", "--no-sandbox"],
  });

  if (fs.existsSync("./discord.png")) {
    fs.unlinkSync("./discord.png");
  }
  const page = await browser.newPage();
  const discord = await page.goto("https://discord.com/login");
  let token;
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.headers().authorization != undefined) {
      console.log("token : " + request.headers().authorization);
      token = request.headers().authorization;
    }
    request.continue();
  });
  try {
    console.log("Checking login state");
    const base64 = await page
      .waitForSelector('[alt="Scan me!"]')
      .then(async () => {
        return await page.$eval('[alt="Scan me!"]', (el) => el.src);
      });
    let buff = new Buffer(
      base64.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    console.log("Saving discord.png");
    fs.writeFileSync("discord.png", buff);
  } catch (e) {
    console.log("Server online : ");
    let app = express();
    app.use(bodyParser.json({ limit: "10mb" }));
    app.use(cors());

    app.post("/upload", async (req, res) => {
      let body = req.body;
      console.log("request : " + JSON.stringify(body));
      const response = await fetch(
        "https://discord.com/api/v9/oauth2/applications/" +
          DISCORD_CLIENT_ID +
          "/assets",
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: token,
          },
          method: "POST",
          body: JSON.stringify(body),
        }
      );
      let response_body = await response.json();
      console.log("response : " + JSON.stringify(await response_body));
      res.send(await response_body);
    });

    app.listen(3000);
  }
})();

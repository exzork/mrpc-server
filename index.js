import puppeteer from "puppeteer";
import fetch from "node-fetch";
import FormData from "form-data";
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
    headless: true,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  if (fs.existsSync("./discord.png")) {
    fs.unlinkSync("./discord.png");
  }
  const page = await browser.newPage();
  const discord = await page.goto("https://discord.com/login");
  try {
    const base64 = await page
      .waitForSelector('[alt="Scan me!"]', { timeout: 5 })
      .then(async () => {
        return await page.$eval('[alt="Scan me!"]', (el) => el.src);
      });
    let buff = new Buffer(
      base64.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    fs.writeFileSync("discord.png", buff);
  } catch (e) {
    const leveldb_dir = fs.readdirSync(
      "./userData/Default/Local Storage/leveldb/"
    );
    let log_file;
    leveldb_dir.forEach((element) => {
      if (element.endsWith(".log")) {
        log_file = element;
      }
    });

    const log_data = fs
      .readFileSync(`./userData/Default/Local Storage/leveldb/${log_file}`)
      .toString();

    let token = log_data.substring(log_data.indexOf("token>") + 8);
    token = token.substring(token.indexOf(':"') + 2, token.indexOf('"}'));
    console.log("token : " + token);

    let app = express();
    app.use(bodyParser.json({ limit: "10mb" }));
    app.use(cors());

    app.post("/upload", async (req, res) => {
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
          body: JSON.stringify(req.body),
        }
      );
      res.send(await response.json());
    });

    app.listen(3000);
  }
})();

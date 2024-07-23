const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
require("dotenv").config();

puppeteer.use(StealthPlugin());

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile("index.html");
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("login-tiktok", async (event, credentials) => {
  const { email, password } = credentials;
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19042"
  );

  const cookiesPath = "cookies.json";
  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath));
    await page.setCookie(...cookies);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  try {
    console.log("navigate to login page");
    await page.goto("https://www.tiktok.com/login/phone-or-email/email", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    let isLoggedIn = false;
    const loggedIn = await page.evaluate(() => {
      return document.querySelector("#main-content-homepage_hot") !== null;
    });

    if (!loggedIn) {
      console.log("navigating login page");
      console.log("typing email");
      await page.waitForSelector(".tiktok-11to27l-InputContainer.etcs7ny1", {
        visible: true,
        timeout: 60000,
      });
      await page.type(".tiktok-11to27l-InputContainer.etcs7ny1", email, {
        delay: 400,
      });

      console.log("typing password");
      await page.waitForSelector("input[type='password']", {
        visible: true,
        timeout: 60000,
      });
      await page.type("input[type='password']", password, { delay: 400 });

      console.log("press button login");
      await Promise.all([
        page.click('#loginContainer button[type="submit"]'),
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
      ]);

      console.log("fyp to loading");
      await sleep(10000);

      console.log("check login status");
      isLoggedIn = (await page.$("#main-content-homepage_hot")) !== null;
      console.log(
        `Login status: ${isLoggedIn ? "Logged In" : "Not Logged In"}`
      );

      if (isLoggedIn) {
        const cookies = await page.cookies();
        fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
      } else {
        console.log("login failed");
        return;
      }
    } else {
      console.log("already logged in");
      isLoggedIn = true;
    }

    if (isLoggedIn) {
      console.log("navigate to fyp");
      await page.goto("https://www.tiktok.com/foryou", {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      console.log("waiting for fyp to load");
      await sleep(10000); 

      const endTime = Date.now() + 5 * 60 * 1000;
      let likedPosts = 0;
      while (Date.now() < endTime && likedPosts < 10) {
        const likeButtons = await page.$$(
          "button.css-1ok4pbl-ButtonActionItem.e1hk3hf90"
        );

        console.log(`Found ${likeButtons.length} like buttons`);

        for (const button of likeButtons) {
          if (likedPosts >= 10 || Date.now() >= endTime) break;
          console.log("liking post...");
          await button.click();
          likedPosts++;
          await sleep(3000); 
        }

        if (Date.now() < endTime) {
          console.log("scrolling");
          await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
          });
          await sleep(5000); 
        }
      }

      console.log("finished liking postss");
    } else {
      console.log("login failed");
    }
  } catch (error) {
    console.error("error >> ", error);
  } finally {
    await browser.close();
  }

  event.reply("login-success", "Finished liking posts or 5 minutes elapsed");
});

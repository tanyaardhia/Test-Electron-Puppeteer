const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const puppeteer = require("puppeteer");
require("dotenv").config();

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
    "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
  );
  await page.goto("https://www.tiktok.com/login/phone-or-email/email", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  try {
    console.log("Navigae login page");
    console.log("typing username");
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

    console.log("login form");
    await Promise.all([
      page.click('#loginContainer button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
    ]);

    console.log("login successful");
    const isLoggedIn =
      (await page.$("selector-for-element-when-logged-in")) !== null;
    console.log(`login status ${isLoggedIn ? "Logged In" : "Not Logged In"}`);

    if (isLoggedIn) {
      await page.waitForTimeout(10000);

      let likedPosts = 0;
      while (likedPosts < 10) {
        const likeButtons = await page.$$('button[data-e2e="like-icon"]');

        for (const button of likeButtons) {
          if (likedPosts >= 10) break;
          console.log("like post");
          await button.click();
          likedPosts++;
          await page.waitForTimeout(3000);
        }

        console.log("scrolling");
        await page.evaluate("window.scrollBy(0, window.innerHeight)");
        await page.waitForTimeout(5000);
      }

      console.log("Successfully liked 10 posts");
    } else {
      console.log(
        "login failed"
      );
    }
  } catch (error) {
    console.error("error during login process:", error);
  } finally {
    await browser.close();
  }

  event.reply("login-success", "Successfully liked 10 posts");
});

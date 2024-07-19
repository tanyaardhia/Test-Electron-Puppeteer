const { ipcMain } = require("electron");
const { app, BrowserWindow } = require("electron/main");
const path = require("node:path");
const { default: puppeteer } = require("puppeteer");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
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

ipcMain.on("login-tiktok", async (event, { email, password }) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://www.tiktok.com");

  try {
    await page.waitForSelector('input[name="email"]', { visible: true });
    await page.type('input[name="email"]', email);

    await page.waitForSelector('input[name="password"]', { visible: true });
    await page.type('input[name="password"]', password);

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);

    if ((await page.$("selector-for-element-when-logged-in")) !== null) {
      console.log("Login successful");

      await page.goto("https://www.tiktok.com/");

      let likedPosts = 0;
      while (likedPosts < 10) {
        const likeButtons = await page.$$('button[data-e2e="like-icon"]');

        for (const button of likeButtons) {
          if (likedPosts >= 10) break;
          await button.click();
          likedPosts++;
          await page.waitForTimeout(2000);
        }

        await page.evaluate("window.scrollBy(0, window.innerHeight)");
        await page.waitForTimeout(3000);
      }
    } else {
      console.log(
        "Login failed, please check your credentials or handle captcha/OTP manually."
      );
    }
  } catch (error) {
    console.error("Error during login process:", error);
  } finally {
    await browser.close();
  }

  event.reply("login-success", "Successfully liked 10 posts");
});

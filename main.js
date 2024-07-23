const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
require("dotenv").config();

// pakai plugin stealth untuk ngindarin deteksi sama TikTok
puppeteer.use(StealthPlugin());

//fungsi ini untuk jendela aplikasi dari electron
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

  //untuk muat HTML ke dalam jendela
  mainWindow.loadFile("index.html");
}

//untuk menjalankan aplikasi electron saat sudah siap
app.on("ready", createWindow);

//untuk menutup jendela ketika user menekan tombol keluar
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

//untuk mulai jendela saat aplikasi diaktifkan kembali (akan dipanggil ketika user melakukan restart)
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

//untuk menerima login credentials dan melakukan login ke TikTok
ipcMain.on("login-tiktok", async (event, credentials) => {
  const { email, password } = credentials;
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19042"
  );

  //cek cookie apakah file sudah ada
  const cookiesPath = "cookies.json";
  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath));
    await page.setCookie(...cookies);
  }

  //untuk menjeda
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  let likedPosts = 0;
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

    //proses login
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

      //kalau berhasil login, simpan cookie
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

    //kalau berhasil login, nanti navigate ke fyp
    if (isLoggedIn) {
      console.log("navigate to fyp");
      await page.goto("https://www.tiktok.com/foryou", {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      console.log("waiting for fyp to load");
      await sleep(10000);

      const endTime = Date.now() + 5 * 60 * 1000; //untuk batas waktu 5 menit
      likedPosts = 0;
      while (Date.now() < endTime && likedPosts < 10) {
        try {
          //untuk proses like post
          await page.waitForFunction(
            () =>
              document.querySelectorAll(
                "button.css-1ok4pbl-ButtonActionItem.e1hk3hf90"
              ).length > 0,
            { timeout: 10000 }
          );

          const likeButtons = await page.$$(
            "button.css-1ok4pbl-ButtonActionItem.e1hk3hf90"
          );

          for (const button of likeButtons) {
            if (likedPosts >= 10 || Date.now() >= endTime) break;
            try {
              if (await button.isIntersectingViewport()) {
                console.log("liking post...");
                await button.click();
                likedPosts++;
                console.log(`Total liked posts: ${likedPosts}`);
                await sleep(3000);
              }
            } catch (err) {
              console.error("Error clicking like button >> ", err);
            }
          }

          if (Date.now() < endTime) {
            console.log("scrolling");
            await page.evaluate(() => {
              window.scrollBy(0, window.innerHeight);
            });
            await sleep(5000);
          }
        } catch (err) {
          console.error("Error during liking posts >> ", err);
        }
      }

      console.log(`finished liking posts: ${likedPosts}`);
    } else {
      console.log("login failed");
    }
  } catch (error) {
    console.error("error >> ", error);
  } finally {
    await browser.close();
  }

  event.reply(
    "login-success",
    `Finished liking posts or 5 minutes elapsed. Total liked posts: ${likedPosts}`
  );
});

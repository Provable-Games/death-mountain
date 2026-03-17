import { app, BrowserWindow } from "electron";
import http from "http";
import fs from "fs";
import path from "path";

const ALLOWED_PATH_PREFIX = "/trials";

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".wasm": "application/wasm",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".wav": "audio/wav",
    ".webp": "image/webp",
    ".webm": "video/webm",
    ".mp4": "video/mp4",
  };
  return types[ext] || "application/octet-stream";
}

function startLocalServer(distPath: string): Promise<number> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", "http://localhost");
      let filePath = path.join(distPath, url.pathname);

      // Serve index.html for SPA routes
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distPath, "index.html");
      }

      try {
        const data = fs.readFileSync(filePath);
        res.writeHead(200, { "Content-Type": getMimeType(filePath) });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    });

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve(port);
    });
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    title: "Loot Survivor 2",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Block navigation to routes outside /trials
  win.webContents.on("will-navigate", (event, url) => {
    try {
      const parsed = new URL(url);
      if (
        !parsed.pathname.startsWith(ALLOWED_PATH_PREFIX) &&
        parsed.pathname !== "/"
      ) {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  if (process.env.NODE_ENV === "development") {
    await win.loadURL(`http://localhost:5173${ALLOWED_PATH_PREFIX}`);
  } else {
    const distPath = path.join(__dirname, "..", "dist");
    const port = await startLocalServer(distPath);
    await win.loadURL(`http://127.0.0.1:${port}${ALLOWED_PATH_PREFIX}`);
  }
}

app.whenReady().then(createWindow);

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

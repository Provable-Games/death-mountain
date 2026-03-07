import { Chainrails, crapi } from "@chainrails/sdk";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const CHAINRAILS_API_KEY = process.env.CHAINRAILS_API_KEY;

if (!CHAINRAILS_API_KEY) {
  throw new Error("CHAINRAILS_API_KEY is not set");
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Chainrails server is running"));

app.get("/create-session", async (req, res) => {
  try {
    Chainrails.config({ api_key: CHAINRAILS_API_KEY });
    
    const {recipient, destinationChain, token } = req.query;

    if (!recipient || !destinationChain || !token) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const session = await crapi.auth.getSessionToken({
      amount: '0',
      recipient: recipient as string,
      destinationChain: destinationChain as any,
      token: token as any,
    });

    res.send(session);
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      message: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

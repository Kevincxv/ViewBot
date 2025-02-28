// Main Entry Point for ViewBot
require("dotenv").config();
const express = require("express");
const path = require("path");
const tmi = require("tmi.js");
const axios = require("axios");

// Import modules
const tiktokIntegration = require("./routes/tiktok");

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// API configuration
const API_KEY = process.env.SMM_API_KEY || "2c85acab6ceea429d46ef2c52393d77f";
const API_URL = process.env.SMM_API_URL || "https://smmcity.com/api/v2";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Available services cache
let servicesList = [];

// Initialize service cache
async function initializeServices() {
  try {
    servicesList = await getServices();
    console.log(`Loaded ${servicesList.length} services from SMM City`);
  } catch (error) {
    console.error("Failed to initialize services:", error.message);
  }
}

// API Functions
async function getServices() {
  try {
    const response = await axios.post(API_URL, {
      key: API_KEY,
      action: "services",
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching services:", error.message);
    return [];
  }
}

async function addOrder(
  serviceId,
  link,
  quantity,
  runs = null,
  interval = null
) {
  try {
    const payload = {
      key: API_KEY,
      action: "add",
      service: serviceId,
      link: link,
      quantity: quantity,
    };

    // Add optional parameters if provided
    if (runs) payload.runs = runs;
    if (interval) payload.interval = interval;

    const response = await axios.post(API_URL, payload);
    return response.data;
  } catch (error) {
    console.error("Error adding order:", error.message);
    throw error;
  }
}

async function getOrderStatus(orderId) {
  try {
    const response = await axios.post(API_URL, {
      key: API_KEY,
      action: "status",
      order: orderId,
    });
    return response.data;
  } catch (error) {
    console.error("Error getting order status:", error.message);
    throw error;
  }
}

async function getUserBalance() {
  try {
    const response = await axios.post(API_URL, {
      key: API_KEY,
      action: "balance",
    });
    return response.data;
  } catch (error) {
    console.error("Error getting balance:", error.message);
    throw error;
  }
}

// Twitch Bot Configuration
const CHANNEL = process.env.TWITCH_CHANNEL || "your_channel";
const twitchClient = new tmi.Client({
  options: { debug: true },
  identity: {
    username: process.env.TWITCH_BOT_USERNAME || "your_bot_username",
    password: process.env.TWITCH_OAUTH_TOKEN || "oauth:your_token",
  },
  channels: [CHANNEL],
});

// Connect Twitch client
twitchClient.connect().catch(console.error);

// Command handler for Twitch chat
twitchClient.on("message", async (channel, tags, message, self) => {
  if (self) return; // Ignore messages from the bot

  const args = message.trim().split(" ");
  const command = args[0].toLowerCase();

  // Only allow commands from moderators or the broadcaster
  const isModOrBroadcaster =
    tags.mod || tags.username === channel.replace("#", "");

  if (command === "!boostfollowers" && isModOrBroadcaster) {
    const quantity = parseInt(args[1]) || 100;
    const link = args[2];

    if (!link) {
      twitchClient.say(channel, `@${tags.username}, please specify a link.`);
      return;
    }

    try {
      // Find a followers service (customize this based on your service list)
      const followersService = servicesList.find((s) =>
        s.name.includes("Followers")
      );

      if (!followersService) {
        twitchClient.say(
          channel,
          `@${tags.username}, followers service not found.`
        );
        return;
      }

      const order = await addOrder(followersService.service, link, quantity);
      twitchClient.say(
        channel,
        `@${tags.username}, order placed! Order ID: ${order.order}`
      );
    } catch (error) {
      twitchClient.say(
        channel,
        `@${tags.username}, failed to place order: ${error.message}`
      );
    }
  }

  if (command === "!balance" && isModOrBroadcaster) {
    try {
      const balance = await getUserBalance();
      twitchClient.say(
        channel,
        `@${tags.username}, current balance: ${balance.balance} ${balance.currency}`
      );
    } catch (error) {
      twitchClient.say(
        channel,
        `@${tags.username}, failed to get balance: ${error.message}`
      );
    }
  }

  if (command === "!orderstatus" && isModOrBroadcaster) {
    const orderId = args[1];
    if (!orderId) {
      twitchClient.say(
        channel,
        `@${tags.username}, please specify an order ID.`
      );
      return;
    }

    try {
      const status = await getOrderStatus(orderId);
      twitchClient.say(
        channel,
        `@${tags.username}, order status: ${status.status}, remains: ${status.remains}`
      );
    } catch (error) {
      twitchClient.say(
        channel,
        `@${tags.username}, failed to get order status: ${error.message}`
      );
    }
  }
});

// Routes
app.use("/api/tiktok", tiktokIntegration.router);

// API Routes
app.post("/api/services", async (req, res) => {
  try {
    const services = await getServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/order", async (req, res) => {
  try {
    const { serviceId, link, quantity, runs, interval } = req.body;
    const order = await addOrder(serviceId, link, quantity, runs, interval);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/status", async (req, res) => {
  try {
    const { orderId } = req.body;
    const status = await getOrderStatus(orderId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/balance", async (req, res) => {
  try {
    const balance = await getUserBalance();
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the dashboard
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initializeServices(); // Load services when the server starts

  // Initialize TikTok integration
  tiktokIntegration.initialize().catch(console.error);
});

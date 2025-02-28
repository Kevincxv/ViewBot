// TikTok Integration Module for Livestream Engagement Bot
// This module handles TikTok-specific functionality

require("dotenv").config();
const axios = require("axios");
const express = require("express");
const router = express.Router();

// SMM City API Configuration
const API_KEY = process.env.SMM_API_KEY || "2c85acab6ceea429d46ef2c52393d77f";
const API_URL = process.env.SMM_API_URL || "https://smmcity.com/api/v2";

// TikTok Settings
const TIKTOK_AUTO_BOOST_ENABLED =
  process.env.TIKTOK_AUTO_BOOST_ENABLED === "true";
const TIKTOK_AUTO_BOOST_VIEWERS = parseInt(
  process.env.TIKTOK_AUTO_BOOST_VIEWERS || "100"
);
const TIKTOK_AUTO_BOOST_SERVICE_ID = parseInt(
  process.env.TIKTOK_AUTO_BOOST_SERVICE_ID || "4"
);

// Cached services
let tiktokServices = [];

// Initialize TikTok services
async function initializeTikTokServices() {
  try {
    const response = await axios.post(API_URL, {
      key: API_KEY,
      action: "services",
    });

    // Filter for TikTok services
    tiktokServices = response.data.filter(
      (service) =>
        service.name.toLowerCase().includes("tiktok") ||
        service.category.toLowerCase().includes("tiktok")
    );

    console.log(`Loaded ${tiktokServices.length} TikTok services`);
  } catch (error) {
    console.error("Failed to initialize TikTok services:", error.message);
  }
}

// Place an order with SMM City API
async function placeOrder(
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
    console.error("Error placing TikTok order:", error.message);
    throw error;
  }
}

// Get TikTok service by type
function getTikTokService(type) {
  return tiktokServices.find((service) =>
    service.name.toLowerCase().includes(type.toLowerCase())
  );
}

// Router for TikTok webhook handler
router.post("/webhook", async (req, res) => {
  try {
    console.log("TikTok webhook received:", req.body);

    // Basic validation of webhook payload
    if (!req.body || !req.body.event_type) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    // Handle live stream start event
    if (req.body.event_type === "live_started" && TIKTOK_AUTO_BOOST_ENABLED) {
      const { username, stream_url } = req.body;

      if (!stream_url) {
        return res
          .status(400)
          .json({ error: "Stream URL not provided in webhook" });
      }

      // Auto-boost viewers for the livestream
      const order = await placeOrder(
        TIKTOK_AUTO_BOOST_SERVICE_ID,
        stream_url,
        TIKTOK_AUTO_BOOST_VIEWERS
      );

      console.log(
        `Auto-boosted TikTok live stream for ${username} with ${TIKTOK_AUTO_BOOST_VIEWERS} viewers. Order ID: ${order.order}`
      );

      return res.json({
        success: true,
        message: "Auto-boost triggered",
        order_id: order.order,
      });
    }

    // Default response for other events
    return res.json({ success: true, message: "Webhook received" });
  } catch (error) {
    console.error("Error processing TikTok webhook:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoints for TikTok
router.post("/boost", async (req, res) => {
  try {
    const { serviceType, link, quantity, runs, interval } = req.body;

    if (!serviceType || !link || !quantity) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Find appropriate service
    const service = getTikTokService(serviceType);

    if (!service) {
      return res
        .status(404)
        .json({ error: `No TikTok service found for type: ${serviceType}` });
    }

    // Place the order
    const order = await placeOrder(
      service.service,
      link,
      quantity,
      runs,
      interval
    );

    return res.json({ success: true, order });
  } catch (error) {
    console.error("Error boosting TikTok:", error);
    return res.status(500).json({ error: "Failed to place order" });
  }
});

// Get available TikTok services
router.get("/services", (req, res) => {
  return res.json(tiktokServices);
});

// Monitor TikTok live status using TikTok API (requires TikTok Developer access)
async function monitorTikTokLiveStatus(username) {
  // Note: This is a placeholder for actual TikTok API integration
  // You would need to use the TikTok API or a third-party service

  console.log(
    `Monitoring TikTok live status for ${username} is not implemented yet.`
  );
  console.log("To implement this feature, you would need to:");
  console.log("1. Create a TikTok Developer account");
  console.log("2. Register an app to get API credentials");
  console.log("3. Use the TikTok API to check live status");

  return {
    isLive: false,
    viewerCount: 0,
    streamUrl: null,
    message: "Not implemented - requires TikTok API access",
  };
}

// Initialize the module
async function initialize() {
  await initializeTikTokServices();
  console.log("TikTok integration module initialized");
}

module.exports = {
  router,
  initialize,
  getTikTokService,
  placeOrder,
  monitorTikTokLiveStatus,
};

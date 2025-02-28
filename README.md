# ViewBot - Twitch & TikTok Livestream Engagement Bot

This bot helps streamers automate engagement services through the SMM City API for both Twitch and TikTok livestreams.

## Features

- Boost followers, viewers, likes, and comments
- Integration with Twitch chat commands
- Automatic boost when going live (configurable)
- Web dashboard for easy management
- Order tracking and history
- Scheduling recurring engagement campaigns

## Quick Start

1. Install dependencies
2. Create a `.env` file from the example
3. Edit the `.env` file with your credentials
- SMM City API key
- Twitch OAuth token (get from https://twitchapps.com/tmi/)
- Twitch channel name
- Other configuration options
4. Start the bot
5. Access the web dashboard at http://localhost:3000

## Twitch Chat Commands

- `!boostfollowers [quantity] [link]` - Add followers to a channel
- `!balance` - Check your current SMM City balance
- `!orderstatus [orderId]` - Check order status

## Security Notice

This tool is provided for educational purposes only. Using engagement services may violate the terms of service of some platforms. Use responsibly and at your own risk.
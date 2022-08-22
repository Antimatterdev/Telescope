# Telescope
[![Discord server](https://img.shields.io/discord/991498223271288872)](https://discord.gg/ezSpNBH6JS)

🤖 **A simple, customizable Discord bot that announces Twitch streams going live.**

![Telescope](https://i.ibb.co/BP8H30g/image.png)

## Features

 - 📢 Monitor and announce Twitch channels going live with customizable `@mentions`.
 - 🔴 Live stream card that is automatically updated with the stream status, current game and viewership statistics.

## Using the bot

This bot is fully open sourced so you dont need to do anything but i do ask that you put my name in the about me as the dev. You dont have to though as im open sourcing this.

## Installation and setup

### Prerequisites

This bot is built on Node.js. If you do not yet have Node installed, download and install the latest LTS version from the official website for your platform:

https://nodejs.org/en/download/

**Node.js, version 12 or newer, is required.**

### Installation

To set up Telescope, download the latest [repository ZIP](https://github.com/Antimatterdev/Telescope/releases/download/Release/Telescope.zip) or clone it using `git`:

    git clone https://github.com/Antimatterdev/Telescope.git
    
Once installed, enter the directory and install the dependencies:

    cd telescope
    npm install

### Getting required tokens

Note that you will need to set up some external applications: 

#### Discord bot application
Your Discord bot needs to be registered as an application, and you will need a bot token  (`discord_bot_token` in Telescope config).

Follow [this guide](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token) for more information.

#### Twitch token
👉 **I recommend using https://twitchtokengenerator.com/ to create an OAuth token for the API.**

Alternatively, you can register your own application in the [Twitch Developers Console](https://dev.twitch.tv/console/apps).

Please note that your OAuth token is always tied to a specific Client ID.

### Configuration
 
To configure Telescope, copy the included `config-sample.json` to `config.json` and enter or customize the values in the file.

```json
{
  "twitch_channels": "<SOME_TWITCH_CHANNEL_NAME>,<SOME_TWITCH_CHANNEL_NAME>",
  "discord_announce_channel": "<DISCORD_CHANNEL_NAME>",
  "discord_mentions": {
    "<SOME_TWITCH_CHANNEL_NAME>": "everyone",
    "<SOME_TWITCH_CHANNEL_NAME>": "here"
  },
  "discord_bot_token": "<SET_ME>",
  "twitch_client_id": "<SET_ME>",
  "twitch_oauth_token": "<SET_ME>",
  "twitch_check_interval_ms": 60000,
  "twitch_use_boxart": true
  "messages":{
    "cooldown_message":"You are on `<duration>` cooldown!",
    "live_message":"<SET_ME>",
    "end_message":"<SET_ME>"
  },
  "clientId":"<SET_ME>",
  "guildId":"<SET_ME>"
}
```    

Configuration options explained:

|Key|Required?|Description|
|---|---------|-----------|
|`twitch_channels`|☑|Comma-separated list of all channels you want to monitor and send live notifications for.|
|`discord_announce_channel`|☑|Channel name to post stream announcements in. Make sure the bot has permissions to post here.|
|`discord_mentions`| |This maps channel names to the Discord @ you want to send, such as a role or `everyone`. If a channel is missing here, no @ is used. Note: once the message is updated, the @ is always removed to prevent spamming users with notifications.|
|`discord_bot_token`|☑|Your bot token, via Discord developer portal.|
|`twitch_client_id`|☑|Client ID for your Twitch app, via developer portal.|
|`twitch_oauth_token`|☑|OAuth token that grants access to your Twitch app, via `id.twitch.tv` as explained above.|
|`twitch_check_interval_ms`| |How often to poll the Twitch API and send or update live embeds.|
|`twitch_use_boxart`| |If true, use alternate Live Embed style that includes game boxart as a thumbnail image if available.|
|`cooldown_message`|☑|The Message the bot sends if a slash command is on cooldown|
|`live_message`|☑|The Message the bot sends when a channel is live|
|`end_message`|☑|The Message the bot sends when a channel goes offline|
|`clientId`|☑|The Client ID of the bot|
|`guildId`|☑|The ID of the guild the bot is being used in|

### Starting Telescope

Once the application has been configured, you just need to run the following command to start the bot

    node .

### Inviting Telescope

Send the following link to the admin of a Discord server to let them invite the Bot:

  `https://discordapp.com/oauth2/authorize?client_id=BOT_CLIENT_ID&scope=bot`
  
Swap `BOT_CLIENT_ID` in the URL above for your Discord app's client id, which you can find in the app details.

const config = require('./Config/config.json');
const clc = require("cli-color");
const axios = require('axios');
const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds, 
		GatewayIntentBits.GuildMessages, 
		GatewayIntentBits.GuildPresences, 
		GatewayIntentBits.GuildMessageReactions, 
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.MessageContent
	], 
	partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction] 
});
const logging = require("./Helpers/logging")
const TwitchMonitor = require("./Handlers/twitch-monitor");
const YoutubeMonitor = require("./Handlers/youtube-monitor");
const DiscordChannelSync = require("./Handlers/discord-channel-sync");
const LiveEmbed = require('./Handlers/live-embed');
const MiniDb = require('./Config/minidb');
// --- Startup ---------------------------------------------------------------------------------------------------------
var telemsg = clc.xterm(116);
var teleimg = clc.xterm(98);
console.log(teleimg('      ,-.'));
console.log(teleimg('     / \\  `.  __..-,O'));
console.log(teleimg('    :   \\ --\'\'_..-\'.\''));
console.log(teleimg('    |    . .-\' `. \'.'));
console.log(teleimg('    :     .     .`.\''));
console.log(teleimg('     \\     `.  /  ..'));
console.log(teleimg('      \\      `.   \' .'));
console.log(teleimg('       `,       `.   \\'));
console.log(teleimg('      ,|,`.        `-.\\'));
console.log(teleimg('     \'.||  ``-...__..-`'));
console.log(teleimg('      |  |'));
console.log(teleimg('      |__|        ')+telemsg('_______   _                                '));
console.log(teleimg('      /||\\       ')+telemsg('|__   __| | |                               '));
console.log(teleimg('     //||\\\\         ')+telemsg('| | ___| | ___  ___  ___ ___  _ __   ___ '));
console.log(teleimg('    // || \\\\        ')+telemsg('| |/ _ \\ |/ _ \\/ __|/ __/ _ \\| \'_ \\ / _ \\'));
console.log(teleimg(' __//__||__\\\\__     ')+telemsg('| |  __/ |  __/\\__ \\ (_| (_) | |_) |  __/'));
console.log(teleimg('\'--------------\'    ')+telemsg('|_|\\___|_|\\___||___/\\___\\___/| .__/ \\___|'));
console.log('                                                 '+telemsg('| |         '));
console.log('                                                 '+telemsg('|_|         '));
// --- Discord ---------------------------------------------------------------------------------------------------------
logging.discord('Connecting to Discord...');

let targetChannels = [];
let syncServerList = (logMembership) => {
    targetChannels = DiscordChannelSync.getChannelList(client, config.discord_announce_channel, logMembership);
};
client.on('ready', () => {
    logging.discord(`Bot is ready; logged in as ${client.user.tag}.`);

    // Init list of connected servers, and determine which channels we are announcing to
    syncServerList(true);

    // Keep our activity in the user list in sync
    StreamActivity.init(client);

    // Begin Twitch API polling
    TwitchMonitor.start();

    // Activate Youtube integration
    YoutubeMonitor.start();
});

client.on("guildCreate", guild => {
    logging.discord(`Joined new server: ${guild.name}`);

    syncServerList(false);
});

client.on("guildDelete", guild => {
    logging.discord(`Removed from a server: ${guild.name}`);

    syncServerList(false);
});
logging.discord('Logging in...');
client.commands = new Collection()
client.aliases = new Collection()
client.slashCommands = new Collection();
client.prefix = config.prefix

module.exports = client;


['slashCommand','events'].forEach((handler) => {
  require(`./Handlers/${handler}`)(client)
});
client.login(config.discord_bot_token);
// Activity updater
class StreamActivity {
    /**
     * Registers a channel that has come online, and updates the user activity.
     */
    static setChannelOnline(stream) {
        this.onlineChannels[stream.user_name] = stream;

        this.updateActivity();
    }

    /**
     * Marks a channel has having gone offline, and updates the user activity if needed.
     */
    static setChannelOffline(stream) {
        delete this.onlineChannels[stream.user_name];

        this.updateActivity();
    }

    /**
     * Fetches the channel that went online most recently, and is still currently online.
     */
    static getMostRecentStreamInfo() {
        let lastChannel = null;
        for (let channelName in this.onlineChannels) {
            if (typeof channelName !== "undefined" && channelName) {
                lastChannel = this.onlineChannels[channelName];
            }
        }
        return lastChannel;
    }

    /**
     * Updates the user activity on Discord.
     * Either clears the activity if no channels are online, or sets it to "watching" if a stream is up.
     */
    static updateActivity() {
        let streamInfo = this.getMostRecentStreamInfo();

        if (streamInfo) {
            this.discordClient.user.setActivity(streamInfo.user_name, {
                "url": `https://twitch.tv/${streamInfo.user_name.toLowerCase()}`,
                "type": "STREAMING"
            });

            logging.stream(`Update current activity: watching ${streamInfo.user_name}.`);
        } else {
            logging.stream('Cleared current activity.');

            this.discordClient.user.setActivity(null);
        }
    }

    static init(discordClient) {
        this.discordClient = discordClient;
        this.onlineChannels = { };

        this.updateActivity();

        // Continue to update current stream activity every 5 minutes or so
        // We need to do this b/c Discord sometimes refuses to update for some reason
        // ...maybe this will help, hopefully
        setInterval(this.updateActivity.bind(this), 5 * 60 * 1000);
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// Live events

let liveMessageDb = new MiniDb('live-messages');
let messageHistory = liveMessageDb.get("history") || { };

TwitchMonitor.onChannelLiveUpdate((streamData) => {
    const isLive = streamData.type === "live";

    // Refresh channel list
    try {
        syncServerList(false);
    } catch (e) { }

    // Update activity
    StreamActivity.setChannelOnline(streamData);

    // Generate message
    const msgFormatted = config.messages["live_message"];
    const msgFormattedEnd = config.messages["end_message"];
    const msgEmbed = LiveEmbed.createForStream(streamData);

    // Broadcast to all target channels
    let anySent = false;

    for (let i = 0; i < targetChannels.length; i++) {
        const discordChannel = targetChannels[i];
        const liveMsgDiscrim = `${discordChannel.guild.id}_${discordChannel.name}_${streamData.id}`;

        if (discordChannel) {
            try {
                // Either send a new message, or update an old one
                let existingMsgId = messageHistory[liveMsgDiscrim] || null;

                if (existingMsgId) {
                    // Fetch existing message
                    discordChannel.messages.fetch(existingMsgId)
                      .then((existingMsg) => {
                        existingMsg.edit({content: msgFormatted, embeds: [msgEmbed]}).then((message) => {
                          // Clean up entry if no longer live
                          if (!isLive) {
                            existingMsg.edit({content: msgFormattedEnd,embeds:[msgEmbed]})
                            delete messageHistory[liveMsgDiscrim];
                            liveMessageDb.put('history', messageHistory);
                          }
                        });
                      })
                      .catch((e) => {
                        // Unable to retrieve message object for editing
                        if (e.message === "Unknown Message") {
                            // Specific error: the message does not exist, most likely deleted.
                            delete messageHistory[liveMsgDiscrim];
                            liveMessageDb.put('history', messageHistory);
                            // This will cause the message to be posted as new in the next update if needed.
                        }
                      });
                } else {
                    // Sending a new message
                    if (!isLive) {
                        // We do not post "new" notifications for channels going/being offline
                        continue;
                    }

                    // Expand the message with a @mention for "here" or "everyone"
                    // We don't do this in updates because it causes some people to get spammed
                    let mentionMode = (config.discord_mentions && config.discord_mentions[streamData.user_name.toLowerCase()]) || null;

                    if (mentionMode) {
                        mentionMode = mentionMode.toLowerCase();

                        if (mentionMode === "everyone" || mentionMode === "here") {
                            // Reserved @ keywords for discord that can be mentioned directly as text
                            mentionMode = `@${mentionMode}`;
                        } else {
                            // Most likely a role that needs to be translated to <@&id> format
                            let roleData = discordChannel.guild.roles.cache.find((role) => {
                                return (role.name.toLowerCase() === mentionMode);
                            });

                            if (roleData) {
                                mentionMode = `<@&${roleData.id}>`;
                            } else {
                                logging.error('[Discord]',`Cannot mention role: ${mentionMode}`, `(does not exist on server ${discordChannel.guild.name})`);
                                mentionMode = null;
                            }
                        }
                    }

                    let msgToSend = msgFormatted;

                    if (mentionMode) {
                        msgToSend = msgFormatted + ` ${mentionMode}`
                    }

                    discordChannel.send({content: msgToSend,embeds: [msgEmbed]})
                        .then((message) => {
                            logging.discord(`Sent announce msg to #${discordChannel.name} on ${discordChannel.guild.name}`)

                            messageHistory[liveMsgDiscrim] = message.id;
                            liveMessageDb.put('history', messageHistory);
                        })
                        .catch((err) => {
                            logging.error('[Discord]',`Could not send announce msg to #${discordChannel.name} on ${discordChannel.guild.name}:`, err.message);
                        });
                }

                anySent = true;
            } catch (e) {
                logging.error('[Discord]','Message send problem:', e);
            }
        }
    }

    liveMessageDb.put('history', messageHistory);
    return anySent;
});

TwitchMonitor.onChannelOffline((streamData) => {
    // Update activity
    StreamActivity.setChannelOffline(streamData);
});

// --- Common functions ------------------------------------------------------------------------------------------------
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

String.prototype.spacifyCamels = function () {
    let target = this;

    try {
        return target.replace(/([a-z](?=[A-Z]))/g, '$1 ');
    } catch (e) {
        return target;
    }
};

Array.prototype.joinEnglishList = function () {
    let a = this;

    try {
        return [a.slice(0, -1).join(', '), a.slice(-1)[0]].join(a.length < 2 ? '' : ' and ');
    } catch (e) {
        return a.join(', ');
    }
};

String.prototype.lowercaseFirstChar = function () {
    let string = this;
    return string.charAt(0).toUpperCase() + string.slice(1);
};

Array.prototype.hasEqualValues = function (b) {
    let a = this;

    if (a.length !== b.length) {
        return false;
    }

    a.sort();
    b.sort();

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}
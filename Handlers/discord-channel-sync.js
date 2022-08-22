/**
 * Helper class for syncing discord target channels.
 */
const { PermissionsBitField } = require('discord.js');
const logging = require("../Helpers/logging")
class DiscordChannelSync {
    /**
     * @param {Client} client Discord.js client.
     * @parfam {string} channelName Name of the Discord channel we are looking for on each server (e.g. `config.discord_announce_channel`).
     * @param {boolean} verbose If true, log guild membership info to stdout (debug / info purposes).
     * @return {Channel[]} List of Discord.js channels
     */
    static getChannelList(client, channelName, verbose) {
        let nextTargetChannels = [];

        client.guilds.cache.forEach((guild) => {
            let targetChannel = guild.channels.cache.find(g => g.name === channelName);

            if (!targetChannel) {
                if (verbose) {
                    logging.error('[Discord]', 'Configuration problem /!\\', `Guild ${guild.name} does not have a #${channelName} channel!`);
                }
            } else {
                let permissions = targetChannel.permissionsFor(guild.members.me);

                if (verbose) {
                    logging.discord(' --> '+`Member of server ${guild.name}, target channel is #${targetChannel.name}`);
                }

                if (!permissions.has(PermissionsBitField.Flags.SendMessages)) {
                    if (verbose) {
                        logging.error('[Discord]', 'Permission problem /!\\', `I do not have SEND_MESSAGES permission on channel #${targetChannel.name} on ${guild.name}: announcement sends will fail.`);
                    }
                }

                nextTargetChannels.push(targetChannel);
            }
        });

        if (verbose) {
            logging.discord(`Discovered ${nextTargetChannels.length} channels to announce to for ${channelName}.`);
        }

        return nextTargetChannels;
    }
}

module.exports = DiscordChannelSync;

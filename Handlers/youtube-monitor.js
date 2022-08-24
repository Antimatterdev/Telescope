const MiniDb = require('../Config/minidb');
const FeedParser = require('feedparser');
const request = require('request');
const config = require('../Config/config.json');
const logging = require("../Helpers/logging")
const DiscordChannelSync = require("../Handlers/discord-channel-sync");
const Discord = require('discord.js');
class YoutubeMonitor {
    static start(client) {
        if (!config.discord_youtube_channel) {
            // Youtube integration is disabled (no channel configured)
            return;
        }

        // Db init
        this.db = new MiniDb('youtube-monitor');

        // Db read
        this.lastAnnouncedVideoGuid = null;

        try {
            const dbRecord = this.db.get("youtube");
            if (dbRecord) {
                this.lastAnnouncedVideoGuid = dbRecord.lastAnnouncedVideoGuid;
            }
        } catch (e) { }

        // Loop
        this.interval = setInterval(() => {
            this.doCheck();
        }, YoutubeMonitor.YT_CHECK_INTERVAL_SECS * 1000);

        this.doCheck(client);
    }

    static doCheck(client) {
        let fpReq = request(this.feedUrl);
        let fp = new FeedParser();

        fpReq.on('error', (err) => {
            logging.error('[Youtube]','Could not check Youtube feed (request error).',err);
        });

        fpReq.on('response', function (res) {
            let stream = this;

            if (res.statusCode === 200) {
                stream.pipe(fp);
            }
        });

        fp.on('error', (err) => {
            logging.error('[Youtube]','Could not check Youtube feed (parser error).', err);
        });

        let highestDate = null;
        let highestItem = null;

        fp.on('readable', function() {
            let stream = this;
            let meta = this.meta;
            let item;
            while (item = stream.read()) {
                let itemDate = Date.parse(item.pubdate);

                if (highestDate == null || itemDate > highestItem) {
                    highestItem = item;
                    highestDate = itemDate;
                }
            }
        });

        fp.on('end', function() {
            if (highestItem) {
                YoutubeMonitor.handleHighestItem(client,highestItem);
            }
        });
    }

    static handleHighestItem(client,rssItem) {
        let lastGuid = this.lastAnnouncedVideoGuid;
        let thisGuid = rssItem.guid;

        if (lastGuid && lastGuid === thisGuid) {
            return;
        }

        logging.youtube(`Found new video to announce: ${rssItem.title} [${rssItem.guid}]`);

        this.db.put("youtube", { lastAnnouncedVideoGuid: thisGuid });
        this.lastAnnouncedVideoGuid = thisGuid;
        this.doAnnounce(client,rssItem);
    }

    static doAnnounce(client,rssItem) {
        this.targetChannels = DiscordChannelSync.getChannelList(client,
            config.discord_youtube_channel, false);
        let msgEmbed = new Discord.EmbedBuilder();
        msgEmbed.setColor(0xFF0000);
        msgEmbed.setURL(`${rssItem.link}`);
        msgEmbed.setTitle(`📣 **${rssItem.author} has uploaded a new video**`);
        msgEmbed.addFields({ name: 'Title', value: rssItem.title, inline:false });
        msgEmbed.setImage(rssItem.image["url"]);
        for (let i = 0; i < this.targetChannels.length; i++) {
            let targetChannel = this.targetChannels[i];

            if (targetChannel) {
                try {
                    targetChannel.send({content:"Sounds of music dance over the airwaves...",embeds:[msgEmbed]});
                } catch (err) {
                    logging.error('[Youtube]','Announce error:', err);
                }
            }
        }
    }

    static get feedUrl() {
        let cacheBuster = Date.now();
        return `${YoutubeMonitor.YT_FEED_BASE_URL}?channel_id=${YoutubeMonitor.YT_CHANNEL_ID}&orderby=published&_cacheBust=${cacheBuster}`;
    }
}

YoutubeMonitor.YT_CHANNEL_ID = config.yt_channel_id;
YoutubeMonitor.YT_FEED_BASE_URL = "https://www.youtube.com/feeds/videos.xml";
YoutubeMonitor.YT_CHECK_INTERVAL_SECS = 10 * 60;

module.exports = YoutubeMonitor;
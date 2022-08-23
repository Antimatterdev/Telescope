const { EmbedBuilder, ApplicationCommandType } = require('discord.js');
const reader = require("../Helpers/reader")
const logging = require("../Helpers/logging")
const fs = require('node:fs');
const path = require('node:path');
module.exports = {
	name: 'forget',
	description: "Choose channels to stop watching for updates",
	type: ApplicationCommandType.ChatInput,
	options: [
        {
            name: 'channel',
            description: 'The channel to forget',
            type: 3,
            required: true
        },
    ],
	run: async (client, interaction) => {
    try{
        const value = interaction.options.get('channel').value;
        if(value){
              reader.jsonReader("./Config/config.json", (err, data) => {
  if (err) {
    logging.error("[Config]","Error reading file:", err);
    return;
  }
  data.twitch_channels = data.twitch_channels.replace(value.toLowerCase()+",","")
  fs.writeFile("./Config/config.json", JSON.stringify(data), err => {
    if (err) logging.error("[Config]","Error writing file:", err);
  });
	});
      
  		await interaction.reply(`Stopped checking ${value} for updates`);
  }
	}catch(err){
    logging.error("[Slash Commands]","Command errored with error: ",err)
  }
  }
}
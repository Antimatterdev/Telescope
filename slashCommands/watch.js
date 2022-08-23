const { EmbedBuilder, ApplicationCommandType } = require('discord.js');
const reader = require("../Helpers/reader")
const logging = require("../Helpers/logging")
const fs = require('node:fs');
const path = require('node:path');
module.exports = {
	name: 'watch',
	description: "Choose channels to watch for updates",
	type: ApplicationCommandType.ChatInput,
	options: [
        {
            name: 'channel',
            description: 'The Channel to watch',
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
  data.twitch_channels = data.twitch_channels+value.toLowerCase()+","
  fs.writeFile("./Config/config.json", JSON.stringify(data), err => {
    if (err) logging.error("[Config]","Error writing file:", err);
  });
	});
      
  		await interaction.reply(`Started watching ${value} for updates`);
  }
	}catch(err){
    logging.error("[Slash Commands]","Command errored with error: ",err)
  }
  }
}
const { EmbedBuilder, ApplicationCommandType } = require('discord.js');
const reader = require("../Helpers/reader")
const logging = require("../Helpers/logging")
const fs = require('node:fs');
const path = require('node:path');
module.exports = {
	name: 'config',
	description: "A Command to change bot config",
	type: ApplicationCommandType.ChatInput,
	options: [
        {
            name: 'type',
            description: 'twitch_channel, announce_channel',
            type: 3,
            required: true
        },
        {
            name: 'value',
            description: 'The value to change in the config',
            type: 3,
            required: true
        },
        {
            name: 'operation',
            description: 'Specify Action if changing channels to be watched',
            type: 3,
            required: false
        },
    ],
	run: async (client, interaction) => {
    try{
        const value = interaction.options.get('value').value;
        const operation = interaction.options.get('operation').value;
        const type = interaction.options.get('type').value;
        if(value){
              reader.jsonReader("./Config/config.json", (err, data) => {
  if (err) {
    logging.error("[Config]","Error reading file:", err);
    return;
  }
  // increase data order count by 1
  if(type.toLowerCase()=="twitch_channel"){
  if(operation.toLowerCase()=="add"){
  data.twitch_channels = data.twitch_channels+value.toLowerCase()+","
  fs.writeFile("./Config/config.json", JSON.stringify(data), err => {
    if (err) logging.error("[Config]","Error writing file:", err);
  });
  }else if(operation.toLowerCase()=="remove"){
    data.twitch_channels = data.twitch_channels.replace(value.toLowerCase()+",","")
  fs.writeFile("./Config/config.json", JSON.stringify(data), err => {
    if (err) logging.error("[Config]","Error writing file:", err);
  });
  }
        }else if(type.toLowerCase()=="announce_channel"){
    data.discord_announce_channel=value.toLowerCase()
      fs.writeFile("./Config/config.json", JSON.stringify(data), err => {
    if (err) logging.error("[Config]","Error writing file:", err);
  });
        }
	});
  		await interaction.reply(`Updated the config value ${type} with the value ${value}`);
  }
	}catch(err){
    logging.error("[Slash Commands]","Command errored with error: ",err)
  }
  }
}
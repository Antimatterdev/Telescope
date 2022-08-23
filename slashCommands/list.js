const { EmbedBuilder, ApplicationCommandType } = require('discord.js');
const reader = require("../Helpers/reader")
const logging = require("../Helpers/logging")
const fs = require('node:fs');
const path = require('node:path');
var output = "";
module.exports = {
	name: 'list',
	description: "Return Config Values or Watched Channels",
	type: ApplicationCommandType.ChatInput,
	options: [
        {
            name: 'option',
            description: 'config, channels',
            type: 3,
            required: true
        },
    ],
	run: async (client, interaction) => {
    try{
        const value = interaction.options.get('option').value;
        if(value){
              reader.jsonReader("./Config/config.json", (err, data) => {
  if (err) {
    logging.error("[Config]","Error reading file:", err);
    return;
  }
   if(value.toLowerCase()=="channels"){
     output=data.twitch_channels
   }else if(value.toLowerCase()=="config"){
     output="Coming Soon"
   }
    
  fs.writeFile("./Config/config.json", JSON.stringify(data), err => {
    if (err) logging.error("[Config]","Error writing file:", err);
  });
	});
      
  		await interaction.reply(output);
  }
	}catch(err){
    logging.error("[Slash Commands]","Command errored with error: ",err)
  }
  }
}
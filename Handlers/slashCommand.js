const fs = require('fs');
const config = require('../Config/config.json');
const { PermissionsBitField } = require('discord.js');
const { Routes } = require('discord-api-types/v9');
const { REST } = require('@discordjs/rest')

const AsciiTable = require('ascii-table');
const table = new AsciiTable().setHeading('Slash Commands', 'Stats').setBorder('|', '=', "0", "0")

const TOKEN = config.discord_bot_token;
const CLIENT_ID = config.clientId;

const rest = new REST({ version: '9' }).setToken(TOKEN);

module.exports = (client) => {
	const slashCommands = []; 
	const files = fs.readdirSync(`./SlashCommands/`).filter(file => file.endsWith('.js'));

		for(const file of files) {
				const slashCommand = require(`../SlashCommands/${file}`);
				slashCommands.push({
					name: slashCommand.name,
					description: slashCommand.description,
					type: slashCommand.type,
					options: slashCommand.options ? slashCommand.options : null,
					default_permission: slashCommand.default_permission ? slashCommand.default_permission : null,
					default_member_permissions: slashCommand.default_member_permissions ? PermissionsBitField.resolve(slashCommand.default_member_permissions).toString() : null
				});
			
				if(slashCommand.name) {
						client.slashCommands.set(slashCommand.name, slashCommand)
						table.addRow(file.split('.js')[0], '✅')
				} else {
						table.addRow(file.split('.js')[0], '⛔')
				}
		}
	console.log(table.toString());

	(async () => {
			try {
				await rest.put(
					config.GUILD_ID ?
					Routes.applicationGuildCommands(CLIENT_ID, config.GUILD_ID) :
					Routes.applicationCommands(CLIENT_ID), 
					{ body: slashCommands }
				);
				console.log('Slash Commands • Registered')
			} catch (error) {
				console.log(error);
			}
	})();
};

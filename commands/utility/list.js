const {SlashCommandBuilder} = require('discord.js');
const fs = require('fs');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("list")
			.setDescription("Lists the current players in the game"),
		async execute(interaction) {

			const server = './data/' + interaction.guildId;

			var game = require('../../' + server + '/game.json');
			var players = game["players"]

			var out = ""
			
			let i = 1;
			for (const player in players) {
				const data = require('../../' + server + '/' + players[player] + '.json');
				out += `${i}. ${data['emoji']} **${data['name']}**\n`;
				i += 1;
			}

			await interaction.reply('Here\'s the current list of players:\n' + out);
		}
}
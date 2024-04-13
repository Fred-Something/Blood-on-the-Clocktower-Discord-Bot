const {SlashCommandBuilder} = require('discord.js');
const fs = require('fs');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("reset")
			.setDescription("Removes all players from the game")
			.setDefaultMemberPermissions(0),
		async execute(interaction) {

			const server = './data/' + interaction.guildId;

			var game = require('../../' + server + '/game.json');
			var players = game["players"]

			for (const player in players) {
				fs.rmSync(server + '/' + players[player] + '.json');
			}

			game['players'] = []

			fs.writeFileSync(server + '/game.json', JSON.stringify(game), {flag: 'w+'}, err => {
				if (err) {
					console.error(err);
				}
			});

			

			await interaction.reply('All players removed from game');
		}
}
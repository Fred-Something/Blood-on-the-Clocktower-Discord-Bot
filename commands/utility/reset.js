const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const playersModule = require('../../modules/players');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("reset")
		.setDescription("Removes all players from the game")
		.setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
	async execute(interaction) {

		const server = './data/' + interaction.guildId;

		var game = require('../../' + server + '/game.json');
		var players = game["players"]

		for (const player of players) {
			fs.rmSync(server + '/' + player + '.json');
			playersModule.clearPlayer(player, interaction.guild);
		}

		game['players'] = [];

		fs.writeFileSync(server + '/game.json', JSON.stringify(game), {flag: 'w+'}, err => {
			if (err) {
				console.error(err);
			}
		});

		await interaction.reply('All players removed from game');
	}
}
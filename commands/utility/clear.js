const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const playersModule = require('../../modules/players');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("clear")
			.setDescription("Make all players alive and able to vote again")
			.setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
		async execute(interaction) {

			const server = './data/' + interaction.guildId;

			var game = require('../../' + server + '/game.json');
			var players = game["players"]

			for (const p in players) {
				var player = require('../../' + server + '/' + players[p] + '.json');

				player['canvote'] = true;
				player['alive'] = true;

				fs.writeFileSync(server + '/' + players[p] + '.json', JSON.stringify(player), {flag: 'w+'}, err => {
					if (err) {
						console.error(err);
					}
				});
			}

			await interaction.reply('Cleared all players\' statuses!');
			await playersModule.updateNicknamesFrom(interaction.guild, 0, game);
		}
}
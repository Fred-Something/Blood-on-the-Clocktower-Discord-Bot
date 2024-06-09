const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const playersModule = require('../../modules/players');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("revive")
			.setDescription("Mark a dead player as alive.")
			.setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
			.addUserOption(option =>
				option.setName('player')
					.setDescription('Player to mark as alive')
					.setRequired(true)),
		async execute(interaction) {

			const id = interaction.options.getUser('player').id;

			const server = './data/' + interaction.guildId;

			var game = JSON.parse(fs.readFileSync(server + '/game.json'));
			var players = game["players"]

			if (!players.includes(id)) {
				await interaction.reply('Player not in game, use /add instead');
				return;
			}

			var player = JSON.parse(fs.readFileSync(server + '/' + id + '.json'));

			if (player['alive']) {
				await interaction.reply('Player is already alive!');
				return;
			}
			player['canvote'] = true;
			player['alive'] = true;

			fs.writeFileSync(server + '/' + id + '.json', JSON.stringify(player), {flag: 'w+'}, err => {
				if (err) {
					console.error(err);
				}
			});

			await interaction.reply('Player is now alive');
			await playersModule.updateNickname(id, interaction.guild, game);
		}
}
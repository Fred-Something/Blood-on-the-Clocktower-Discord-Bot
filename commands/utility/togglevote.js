const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const playersModule = require('../../modules/players');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("togglevote")
			.setDescription("Toggles if a player is able to vote (for example, if they used their dead vote)")
			.setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
			.addUserOption(option =>
				option.setName('player')
					.setDescription('Player to toggle the vote of')
					.setRequired(true))
			.addBooleanOption(option =>
				option.setName('on')
					.setDescription('Are they allowed to vote? Defaults to opposite of current voting ability')
					.setRequired(false)),
		async execute(interaction) {

			const id = interaction.options.getUser('player').id;

			const server = './data/' + interaction.guildId;

			var game = require('../../' + server + '/game.json');
			var players = game["players"]

			if (!players.includes(id)) {
				await interaction.reply('Player not in game, use /add instead');
				return;
			}

			var player = require('../../' + server + '/' + id + '.json');

			var vote = player['canvote'];
			vote = interaction.options.getBoolean('on') ?? !vote;
			player['canvote'] = vote;

			fs.writeFileSync(server + '/' + id + '.json', JSON.stringify(player), {flag: 'w+'}, err => {
				if (err) {
					console.error(err);
				}
			});

			await interaction.reply('Voting set to ' + vote);
			await playersModule.updateNickname(id, interaction.guild, game);
		}
}
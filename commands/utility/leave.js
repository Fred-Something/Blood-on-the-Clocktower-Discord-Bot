const {SlashCommandBuilder} = require('discord.js');
const signups = require('../../modules/players');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("leave")
		.setDescription("Leave the game"),
	async execute(interaction) {
		const server = './data/' + interaction.guildId;
		const game = require('../../' + server + '/game.json');

		if (!game['open']) {
			await interaction.reply('Cannot leave ongoing game, notify the storyteller if you need to leave early.');
			return;
		}

		try {
			let user = interaction.user;
			await signups.remove(
				user,
				interaction.guildId,
			)
			await interaction.reply('**' + user.globalName + '** removed from game');
		} catch (e) {
			await interaction.reply(e);
		}
	}
}
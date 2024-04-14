const {SlashCommandBuilder} = require('discord.js');
const signups = require('../../modules/players');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("remove")
		.setDescription("Removes a player from the game")
		.setDefaultMemberPermissions(0)
		.addUserOption(option =>
			option.setName('player')
				.setDescription('Player you want to remove')
				.setRequired(true)),
	async execute(interaction) {
		try {
			let user = interaction.options.getUser('player');
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
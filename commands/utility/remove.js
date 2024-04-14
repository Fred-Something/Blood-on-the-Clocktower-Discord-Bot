const {SlashCommandBuilder} = require('discord.js');
const playersModule = require('../../modules/players');

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
			let { user, nicknameError } = await playersModule.remove(
				interaction.options.getUser('player'),
				interaction.guild,
			)
			await interaction.reply('**' + user.globalName + '** removed from game' + nicknameError);
		} catch (e) {
			await interaction.reply(e);
		}
	}
}
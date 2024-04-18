const { SlashCommandBuilder } = require('discord.js');
const nominationGif = require('../../modules/nominationGif');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("nominate")
			.setDescription("Generate an animation for a player nominating another player")
			.setDefaultMemberPermissions(0)
			.addUserOption(option =>
				option.setName('accuser')
					.setDescription('Player that called the nomination')
					.setRequired(true))
			.addUserOption(option =>
				option.setName('nominee')
					.setDescription('Player that is being nominated')
					.setRequired(true)),
		async execute(interaction) {
			const user1 = interaction.options.getUser('accuser');
			const user2 = interaction.options.getUser('nominee');

			const text = `**${user1.displayName.toUpperCase()}** nominates **${user2.displayName.toUpperCase()}**`;
			await interaction.reply(text + '...');
			
			const gifBuffer = await nominationGif.generateBuffer(user1, user2);

			await interaction.editReply({
				content: text + '.',
				files: [{
					attachment: gifBuffer,
					name: `${user1.username}_nominates_${user2.username}.gif`,
				}],
			});
		}
}
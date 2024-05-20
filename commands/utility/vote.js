const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const voting = require('../../modules/voting');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("vote")
		.setDescription("Starts a vote")
		.setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
		.addUserOption(option =>
			option.setName('nominee')
				.setDescription('Player who was nominated, aka player who will vote last')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('countdown')
			.setDescription('Seconds before voting will start. Leave blank to start voting manually')
				.setRequired(false))
		.addBooleanOption(option =>
			option.setName('exile')
			.setDescription('Whether this is a vote to exile a traveler, so dead players are counted too')
				.setRequired(false))
		.addUserOption(option =>
			option.setName('voudon')
			.setDescription('Specify if a Voudon is in play, and who they are, so only they & the dead can vote')
				.setRequired(false))
		.addBooleanOption(option =>
			option.setName('atheist')
			.setDescription('Whether this is a vote for the storyteller instead of the specified nominee')
				.setRequired(false)),
	async execute(interaction) {

		const nominee = interaction.options.getUser('nominee');

		try {
			await voting.votingMessage(message => interaction.reply(message), nominee, interaction.user, interaction.guild, {
				countdown: interaction.options.getInteger('countdown'),
				atheist: interaction.options.getBoolean('atheist'),
				exile: interaction.options.getBoolean('exile'),
				voudon: interaction.options.getUser('voudon'),
			});
		} catch (e) {
			await interaction.reply(`${e}`);
		}

	}
}

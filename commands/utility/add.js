const {SlashCommandBuilder} = require('discord.js');
const signups = require('../../modules/players');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("add")
		.setDescription("Adds a player to the game")
		.setDefaultMemberPermissions(0)
		.addUserOption(option =>
			option.setName('player')
				.setDescription('Player you want to add')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('emoji')
				.setDescription('The emoji the player will be represented by')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('name')
				.setDescription('The name the player will be represented by (defaults to display name)')
				.setRequired(false))
		.addIntegerOption(option =>
			option.setName('position')
				.setDescription('The position they\'ll be added in (default, anticlockwise to first player)')
				.setRequired(false)),
	async execute(interaction) {
		let position = interaction.options.getInteger('position');

		try {
			let { name, emoji } = await signups.add(
				interaction.options.getUser('player'),
				interaction.options.getString('emoji'),
				interaction.guildId,
				interaction.options.getString('name'),
				typeof position == "number" ? (position - 1) : null,
			);
			await interaction.reply('**' + name + '** ' + emoji + ' joined the game!');
		} catch (e) {
			await interaction.reply(`${e}`);
		}
	}
}
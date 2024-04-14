const {SlashCommandBuilder} = require('discord.js');
const playersModule = require('../../modules/players');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("join")
		.setDescription("Join a game in signups")
		.addStringOption(option =>
			option.setName('emoji')
				.setDescription('The emoji you will be represented by')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('name')
				.setDescription('The name the you will be represented by (defaults to display name)')
				.setRequired(false)),
	async execute(interaction) {

		const server = './data/' + interaction.guildId;
		const game = require('../../' + server + '/game.json');

		if (!game['open']) {
			await interaction.reply('Game cannot be joined: Signups are not open.');
			return;
		}
		
		try {
			let { name, emoji, nicknameError, position } = await playersModule.add(
				interaction.user,
				interaction.options.getString('emoji'),
				interaction.guild,
				interaction.options.getString('name'),
			);
			await interaction.reply('**' + name + '** ' + emoji + ' joined the game (#' + (position + 1) + ')!' + (nicknameError || ""));
		} catch (e) {
			await interaction.reply(`${e}`);
		}
	}
}
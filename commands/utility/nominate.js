const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sleep } = require('../../modules/sleep');
const nominationGif = require('../../modules/nominationGif');
const voting = require('../../modules/voting');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("nominate")
			.setDescription("Starts a nomination by creating an animation and preparing the vote")
			.setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
			.addUserOption(option =>
				option.setName('accuser')
					.setDescription('Player that called the nomination')
					.setRequired(true))
			.addUserOption(option =>
				option.setName('nominee')
					.setDescription('Player that is being nominated')
					.setRequired(true))
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
					.setRequired(false))
			.addBooleanOption(option =>
				option.setName('novote')
					.setDescription('Whether to not prepare a vote on the nominee, and simply post the animation alone')
					.setRequired(false)),
		async execute(interaction) {

			const accuser = interaction.options.getUser('accuser');
			let nominee = interaction.options.getUser('nominee');

			const text = `**${accuser.displayName.toUpperCase()}** nominates **${nominee.displayName.toUpperCase()}**`;
			await interaction.reply(text + '...');
			
			const gifBuffer = await nominationGif.generateBuffer(accuser, nominee);

			await interaction.editReply({
				content: text + '.',
				files: [{
					attachment: gifBuffer,
					name: `${accuser.username}_nominates_${nominee.username}.gif`,
				}],
			});

			if (interaction.options.getBoolean('novote')) return;

			await sleep(nominationGif.GIF_DURATION + 1000);
			try {
				if (interaction.options.getBoolean('atheist')) {
					nominee = accuser;
				}
				await voting.votingMessage(message => interaction.channel.send(message), nominee, interaction.user, interaction.guild, {
					countdown: null,
					atheist: interaction.options.getBoolean('atheist'),
					exile: interaction.options.getBoolean('exile'),
					voudon: interaction.options.getUser('voudon'),
				});
			} catch (e) {
				console.error(`Error creating voting for nomination: ${e}`);
			}
			
		}
}
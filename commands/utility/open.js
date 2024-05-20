const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("open")
			.setDescription("Open game signups, allowing people to join or leave")
			.setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
		async execute(interaction) {
			const server = interaction.guildId;

			const fileName = './data/' + server + '/game.json';

			var game = require('../../' + fileName);
			game['open'] = true;

			fs.writeFileSync(fileName, JSON.stringify(game), {flag: 'w+'}, err => {
				if (err) {
					console.error(err);
				}
			});

			interaction.reply('Signups opened! All players should use /join to join. (Remember to provide your game emoji!)')
		}
}
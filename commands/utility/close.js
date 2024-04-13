const {SlashCommandBuilder} = require('discord.js');
const fs = require('fs');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("close")
			.setDescription("Close game signups, not allowing people to join or leave")
			.setDefaultMemberPermissions(0),
		async execute(interaction) {
			const server = interaction.guildId;

			const fileName = './data/' + server + '/game.json';

			var game = require('../../' + fileName);
			game['open'] = false;

			fs.writeFileSync(fileName, JSON.stringify(game), {flag: 'w+'}, err => {
				if (err) {
					console.error(err);
				}
			});

			interaction.reply('Signups closed')
		}
}
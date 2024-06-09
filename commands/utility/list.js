const {SlashCommandBuilder} = require('discord.js');
const fs = require('fs');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("list")
			.setDescription("Lists the current players in the game"),
		async execute(interaction) {

			const server = './data/' + interaction.guildId;

			var game = JSON.parse(fs.readFileSync(server + '/game.json'));
			var players = game["players"]

			let out = ""
			
			let i = 1;
			for (const player in players) {
				const data = JSON.parse(fs.readFileSync(server + '/' + players[player] + '.json'));
				out += `${i}.`;
				out += ' ' + data.emoji;
				if (data.canvote) {
					if (!data.alive) out += " 💀";
				} else {
					if (!data.alive) out += " 🦴";
					else out += " ❗";
				}
				out += ` **${data.name}**`;
				out += '\n';
				i += 1;
			}

			await interaction.reply('Here\'s the current list of players:\n' + out);
		}
}
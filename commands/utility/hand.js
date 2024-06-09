const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const playersModule = require('../../modules/players');

module.exports = {
		data: new SlashCommandBuilder()
			.setName("hand")
			.setDescription("Raise or lower your hand when in-game"),
		async execute(interaction) {

			const id = interaction.user.id;
			const server = './data/' + interaction.guildId;

			var game = JSON.parse(fs.readFileSync(server + '/game.json'));
			var players = game["players"]

			if (!players.includes(id)) {
				await interaction.reply('You are not in a game');
				return;
			}

			let player = JSON.parse(fs.readFileSync(server + '/' + id + '.json'));
            player.handRaised = !player.handRaised;

			fs.writeFileSync(server + '/' + id + '.json', JSON.stringify(player), {flag: 'w+'}, err => {
				if (err) {
					console.error(err);
				}
			});

			await interaction.reply({ content: `You ${player.handRaised ? "raised" : "lowered"} your hand.`, ephemeral: true });
			await playersModule.updateNickname(id, interaction.guild, game);
            
		}
}
const {SlashCommandBuilder} = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
      .setName("leave")
      .setDescription("Leave the game"),
    async execute(interaction) {

      const player = interaction.user;

      const server = './data/' + interaction.guildId;

      var game = require('../../' + server + '/game.json');
      var players = game["players"]

      if (!game['open']) {
        await interaction.reply('Cannot leave ongoing game, notify the storyteller if you need to leave early.');
        return;
      }

      const id = player.id;

      if (!players.includes(id)) {
        await interaction.reply('Player not in game');
        return;
      }

      players.splice(players.indexOf(id), 1);
      game['players'] = players

      fs.writeFileSync(server + '/game.json', JSON.stringify(game), {flag: 'w+'}, err => {
        if (err) {
          console.error(err);
        }
      });

      fs.rmSync(server + '/' + id + '.json')

      await interaction.reply('**' + player.globalName + '** removed from game');
    }
}
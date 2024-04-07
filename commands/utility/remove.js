const {SlashCommandBuilder} = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
      .setName("remove")
      .setDescription("Removes a player from the game")
      .setDefaultMemberPermissions(0)
      .addUserOption(option =>
        option.setName('player')
          .setDescription('Player you want to remove')
          .setRequired(true)),
    async execute(interaction) {

      const player = interaction.options.getUser('player');

      const server = './data/' + interaction.guildId;

      var game = require('../../' + server + '/game.json');
      var players = game["players"]

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
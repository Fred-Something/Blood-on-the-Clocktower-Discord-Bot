const {SlashCommandBuilder} = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
      .setName("clear")
      .setDescription("Give all players their votes back")
      .setDefaultMemberPermissions(0),
    async execute(interaction) {

      const server = './data/' + interaction.guildId;

      var game = require('../../' + server + '/game.json');
      var players = game["players"]

      for (const p in players) {
        var player = require('../../' + server + '/' + players[p] + '.json');

        player['canvote'] = true;

        fs.writeFileSync(server + '/' + players[p] + '.json', JSON.stringify(player), {flag: 'w+'}, err => {
          if (err) {
            console.error(err);
          }
        });
      }

      await interaction.reply('Votes restored!');
    }
}
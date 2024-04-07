const {SlashCommandBuilder} = require('discord.js');
const fs = require('fs');

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

      var game = require('../../' + server + '/game.json');
      var players = game["players"]

      if (!game['open']) {
        await interaction.reply('Game cannot be joined: Signups are not open.');
        return;
      }

      const player = interaction.user;

      var emoji = interaction.options.getString('emoji');

      // Check if the message contains any custom server emojis
      var emojis = emoji.match(/<a?:\w+:\d+>/g);

      if (emojis != null) {
        emoji = emojis[0]
      }
      else {
        // Check if the message contains any Unicode emoji characters
        emojis = emoji.match(/\p{Emoji}/gu);
        if (emojis != null) {
          emoji = emojis[0]
        }
        else {
          await interaction.reply('Cannot read emoji!');
          return;
        }
      }

      const name = interaction.options.getString('name') ?? player.globalName;
      const id = player.id;

      if (players.includes(id)) {
        await interaction.reply('You\'re already in the game!');
        return;
      }

      players.splice(players.length, 0, id);
      game['players'] = players

      fs.writeFileSync(server + '/game.json', JSON.stringify(game), {flag: 'w+'}, err => {
        if (err) {
          console.error(err);
        }
      });

      const init = {"name":name,"canvote":true,"emoji":emoji}

      fs.writeFileSync(server + '/' + id + '.json', JSON.stringify(init), {flag: 'w+'}, err => {
        if (err) {
          console.error(err);
        }
      });

      await interaction.reply('**' + name + '** ' + emoji + ' joined the game!');
    }
}
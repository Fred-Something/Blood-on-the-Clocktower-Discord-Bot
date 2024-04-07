const {SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType} = require('discord.js');

// const client = new Client({
// 	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
// 	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
// });

// const collectorFilter = (reaction, user) => {
// 	return true;
// };

module.exports = {
    data: new SlashCommandBuilder()
      .setName("vote")
      .setDescription("Starts a vote")
      .setDefaultMemberPermissions(0)
      .addUserOption(option =>
        option.setName('player')
          .setDescription('Player the vote will start at')
          .setRequired(true)),
    async execute(interaction) {

      const server = './data/' + interaction.guildId;

      const game = require('../../' + server + '/game.json');
      const players = game["players"]

      const start = interaction.options.getUser('player');

      if (!players.includes(start.id)) {
        await interaction.reply('Player not in game!');
        return;
      }

      var voters = new Array;
      var voteids = new Array;
      const offset = players.indexOf(start.id);

      for (const player in players) {
        const cur = (Number(player) + Number(offset)) % players.length;
        const p = require('../../' + server + '/' + players[cur] + '.json');
        if (!p['canvote']) continue;
        const voteinfo = {name:p['name'],emoji:p['emoji']}
        voters.splice(voters.length, 0, voteinfo);
        voteids.splice(voters.length, 0, players[cur]);
      }

      // console.log(voters);
      // console.log(voteids);

      var text = "VOTING IS NOW OPEN\n\nThe voting order will be as follows:\n";

      for (const voter in voters) {
        if (voter > 0) text += ' -> ';
        text += voters[voter]['emoji'];
      }

      text += '\n\n'
      text += voters[0]['emoji'] + ' **' + voters[0]['name'] + '**\'s vote will be recorded in 5 seconds\n'
      
      const vote = new ButtonBuilder()
		    .setCustomId('Vote')
		    .setLabel('Raise Hand')
		    .setStyle(ButtonStyle.Danger);

		  const unvote = new ButtonBuilder()
		  	.setCustomId('Unvote')
		  	.setLabel('Lower Hand')
		  	.setStyle(ButtonStyle.Primary);
    
		  const row = new ActionRowBuilder()
		  	.addComponents(vote, unvote);

      var votes = new Array(voters.length).fill(false);
      var count = 0;
    
		  const message = await interaction.reply({
		  	content: text + votescreen(count, voters, votes),
		  	components: [row],
		  });

      const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 10_000 });
      collector.on('collect', i => {
        if (voteids.includes(i.user.id)) {
          if (voteids.indexOf(i.user.id) >= count) {
            votes[voteids.indexOf(i.user.id)] = (i.customId === 'Vote');
            i.deferUpdate();
          }
          else {
            i.reply({ content: `Your vote has been recorded, and cannot be changed.`, ephemeral: true });
          }
        } else {
          i.reply({ content: `You are not able to vote!`, ephemeral: true });
        }
      });

      for (let i = 0; i < 4; i++) {
        await sleep(1050);
        interaction.editReply(text + votescreen(count, voters, votes));
      }

      for (const voter in voters) {
        await sleep(1050);
        text += voters[count]['emoji'] + ' **' + voters[count]['name'] + '** has '
          + (votes[count] ? '**VOTED**' : '**ABSTAINED**')
        text += (count >= votes.length - 1 ? '\n' : ' (' + voters[count + 1]['emoji'] + ' **' + voters[count + 1]['name'] + '** is next)\n');
        count++;
        await interaction.editReply(text + votescreen(count, voters, votes));
      }

      const num = votes.filter(Boolean).length
      await interaction.editReply({
        content : text + votescreen(count, voters, votes) + '\n\nVote concluded with **' + num + '** vote' + (num == 1 ? '.' : 's.'),
        components: []
      });
    }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function votescreen(count, voters, votes) {
  // console.log(votes.length - count - 1);
  var out = '\n'
  out += (count == votes.length ? '' : ('⬛'.repeat(count)) + '⬇' + ('⬛'.repeat(votes.length - count - 1)) + '\n');
  out += voters.map(v => v.emoji).join('') + '\n';
  for (let i = 0; i < count; i++) {
    out += votes[i] ? '🟥' : '🟪';
  }
  for (let i = count; i < votes.length; i++) {
    out += votes[i] ? '🟧' : '🟦';
  }
  return out;
}
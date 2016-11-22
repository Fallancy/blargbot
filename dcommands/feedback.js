var e = module.exports = {};

const Trello = require('node-trello');
var t;
const moment = require('moment');

e.init = () => {
    e.category = bu.CommandType.GENERAL;
    t = new Trello(config.general.trellokey, config.general.trellotoken);
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'feedback <feedback>';
e.alias = ['suggest'];
e.info = 'Sends me feedback. Thanks!';
e.longinfo = `<p>Sends feedback to my guild. Thank you! It's very important to me.</p>`;

e.execute = async function(msg, words) {
        if (words.length > 1) {
            let i = 0;
            let lastSuggestion = await r.table('suggestion').orderBy({
                index: r.desc('id')
            }).limit(1).run();
            if (lastSuggestion.length > 0) i = lastSuggestion[0].id + 1;
            logger.debug(i, lastSuggestion);
            if (isNaN(i)) i = 0;

            await bu.send('195716879237644292', `
**__${i} | Feedback__**
**Author**: ${msg.author.username} (${msg.author.id})${msg.channel.guild
                ? `\n**Guild**: ${msg.channel.guild.name} (${msg.channel.guild.id})
**Channel**: ${msg.channel.name} (${msg.channel.id})` : ''}
**Message**: ${msg.id}
${words.slice(1).join(' ')} 
`);
        t.post('1/cards', {
            name: words.slice(1).join(' '),
            desc: `Automated feedback added by blargbot - CASE ${i}.\n\nAuthor: ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
            due: null,
            idList: '57ef25d2ba874bf651e96fc1',
            idLabels: '58025f0184e677fd36dbd756'
        }, (err) => {
            if (err) throw err;
        });
        await r.table('suggestion').insert({
            id: i,
            author: msg.author.id,
            channel: msg.channel.id,
            message: words.slice(1).join(' '),
            messageid: msg.id,
            date: r.epochTime(moment().unix())
        }).run();
        await bu.send(msg, 'Feedback sent! :ok_hand:');
    }
};
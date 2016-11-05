var e = module.exports = {};





e.init = () => {
    
    

    e.category = bu.CommandType.ADMIN;

};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'reason <caseid | latest> <reason>';
e.info = 'Sets the reason for an action on the modlog.';
e.longinfo = `<p>Sets the reason for an action on the modlog.</p>`;

e.execute = async function(msg, words) {
    let val = await bu.guildSettings.get(msg.channel.guild.id, 'modlog');
    if (val) {
        if (words.length >= 3) {
            var latest = false;
            if (words[1].toLowerCase() == 'latest' || words[1].toLowerCase() == 'l') {
                latest = true;
            }
            words.shift();
            var caseid = parseInt(words.shift());
            logger.debug(caseid);
            let storedGuild = await r.table('guild').get(msg.channel.guild.id).run();
            let modlog = storedGuild.modlog;
            let index = latest ? modlog.length - 1 : caseid;
            if (modlog.length > 0 && modlog[index]) {

                let msg2 = await bot.getMessage(val, modlog[index].msgid);
                var content = msg2.content;
                content = content.replace(/\*\*Reason:\*\*.+?\n/, `**Reason:** ${words.join(' ')}\n`);
                modlog[index].reason = words.join(' ');
                if (!modlog[index].modid) {
                    content = content.replace(/\*\*Moderator:\*\*.+/, `**Moderator:** ${msg.author.username}#${msg.author.discriminator}`);
                    modlog[index].modid = msg.author.id;
                }
                r.table('guild').get(msg.channel.guild.id).update({
                    modlog: modlog
                }).run();

                bot.editMessage(val, modlog[index].msgid, content);
                bu.send(msg, ':ok_hand:');
            } else {
                bu.send(msg, 'That case does not exist!');
            }
        }
    }
};
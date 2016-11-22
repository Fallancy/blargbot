var e = module.exports = {};




e.init = () => {
    
    

    e.category = bu.CommandType.ADMIN;

};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'unmute <user>';
e.info = 'Unmutes a user.\nIf mod-logging is enabled, the unmute will be logged.';
e.longinfo = `<p>Unmutes a user.</p>
    <p>If mod-logging is enabled, the unmute will be logged.</p>`;

e.execute = async function(msg, words) {
    let mutedrole = await bu.guildSettings.get(msg.channel.guild.id, 'mutedrole');

    if (!mutedrole) {
        bu.send(msg, `No muted users were found. You can only unmute users muted with \`mute\`.`);
    }
    if (words.length > 1) {

        if (msg.channel.guild.members.get(bot.user.id).permission.json.manageRoles) {
       //     if (msg.member.permission.json.manageRoles) {
                if (words[1]) {
                    var user = await bu.getUser(msg, words[1]);
                    var member = msg.channel.guild.members.get(user.id);
                    if (!user)
                        return;

                    if (member.roles.indexOf(mutedrole) == -1) {
                        bu.send(msg, 'That user isn\'t muted!');
                    } else {
                        var roles = member.roles;
                        roles.splice(roles.indexOf(mutedrole), 1);
                        bot.editGuildMember(msg.channel.guild.id, user.id, {
                            roles: roles
                        });
                        bu.logAction(msg.channel.guild, user, msg.author, 'Unmute');
                        bu.send(msg, ':ok_hand:');
                    }


                    //   if (!bu.bans[msg.channel.guild.id])
                    //        bu.bans[msg.channel.guild.id] = {}
                    //    bu.bans[msg.channel.guild.id][user.id] = msg.author.id
                    //    var deletedays = 0
                    //    if (words[2])
                    //       deletedays = parseInt(words[2])
                    // bot.banGuildMember(msg.channel.guild.id, user.id, deletedays)
                }
                //bot.ban
 //           } else {
 //               bu.send(msg, `You don't have permission to mute users! Make sure you have the \`manage roles\` permission and try again.`);
 //           }
        } else {
            bu.send(msg, `I don't have permission to mute users! Make sure I have the \`manage roles\` permission and try again.`);
        }
    }
};
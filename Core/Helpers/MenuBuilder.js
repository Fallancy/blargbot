const Context = require('../Structures/Context');
const BaseHelper = require('./BaseHelper');
const EventEmitter = require('eventemitter3');

const Eris = require('eris');
const moment = require('moment');

const emoteMap = [
    '<:b1:323867235456122881>',
    '<:b2:323867235787735042>',
    '<:b3:323867236391714816>',
    '<:b4:323867235712106498>',
    '<:b5:323867235695198221>',
    '<:b6:323867236194451456>',
    '<:b7:323867236248977419>',
    '<:b8:323867236144250911>',
    '<:b9:323867236307697665>',
    '<:b10:323871634362728459>'
];

class MenuError extends Error {
    constructor(message, embed) {
        super(message);
        this.name = this.constuctor.name;
        this.embed = embed;
    }
}

class Menu extends EventEmitter {
    constructor(client, ctx) {
        super();
        this.ctx = ctx;
        this.client = client;
        this.content = '';

        this.embed = this.client.Helpers.Embed.build(this.ctx);

        this.choices = [];

        this.strict = false;

        this.msg = null;
        this.page = 0;
        this.tempVals = [];
    }

    get emoteRegex() {
        return /(\d{17,23})/;
    }

    setStrict(bool = true) {
        this.strict = bool;
    }

    getEmoteId(emote) {
        if (this.emoteRegex.test(emote)) {
            emote = emote.match(this.emoteRegex)[0];
        }
        return emote;
    }

    addDecodeChoice(name, description, value, emote) {
        this.choices.push({
            name, description, emote, value,
            decode: true
        });
        emote = this.getEmoteId(emote);
        this.on(emote, (userId) => {
            this.emit('result', userId, value);
        });
        return this;
    }

    addChoice(name, description, value, emote) {
        this.choices.push({ name, description, value, emote });
        emote = this.getEmoteId(emote);
        this.on(emote, (userId) => {
            this.emit('result', userId, value);
        });
        return this;
    }

    addConfirm() {
        this.choices.push({ name: 'menu.confirm.name', description: 'menu.confirm.description', emote: '✅', decode: true });
        this.on('✅', (userId) => {
            this.emit('confirm', userId);
            this.close();
        });
        return this;
    }

    addCancel() {
        this.choices.push({ name: 'menu.cancel.name', description: 'menu.cancel.description', emote: '❌', decode: true });
        this.on('❌', (userId) => {
            this.emit('cancel', userId);
            this.close();
        });
        return this;
    }

    addPagination() {
        this.choices.push({
            emote: '⬅'
        });
        this.on('⬅', (userId) => {
            this.emit('pageLeft', userId);
        });
        this.choices.push({
            emote: '➡'
        });
        this.on('➡', (userId) => {
            this.emit('pageRight', userId);
        });
        return this;
    }

    emit(event, userId, value) {
        if (this.client.user.id === userId) return;
        if (this.strict && this.ctx.user.id !== userId) return;
        super.emit(event, userId, value);
    }

    async paginate(values = []) {
        if (this.page < 0) this.page = Math.ceil(values.length / 5) - 1;
        if (this.page > Math.ceil(values.length / 5) - 1) this.page = 0;
        this.strict = true;
        let choiceString = '';
        // Grab 10 items
        this.tempVals = values.slice(this.page * 5, (this.page * 5) + 5);
        for (let i = 0; i < this.tempVals.length; i++) {
            choiceString += `${emoteMap[i]} ${this.tempVals[i].name}\n`;
        }

        if (this.msg == null) {
            return await new Promise(async (resolve, reject) => {
                try {
                    this.resolve = resolve, this.reject = reject;
                    this.embed.addField(await this.ctx.decode('generic.menu.choices', {
                        page: this.page + 1,
                        max: Math.ceil(values.length / 5)
                    }), choiceString);
                    this.on('pageRight', () => {
                        this.page++;
                        this.paginate(values);
                    });
                    this.on('pageLeft', () => {
                        this.page--;
                        this.paginate(values);
                    });

                    this.msg = await this.embed.send();

                    if (!this.client.awaitedReactions[this.ctx.channel.id])
                        this.client.awaitedReactions[this.ctx.channel.id] = {};
                    this.client.awaitedReactions[this.ctx.channel.id][this.msg.id] = this;
                    this.on('result', (userid, value) => {
                        if (this.tempVals[value]) {
                            this.resolve(this.tempVals[value]);
                            this.close(true);
                        }
                    });

                    for (let i = 0; i < emoteMap.length && i < this.tempVals.length; i++) {
                        this.addChoice('', '', i, emoteMap[i]);
                        let emote = this.choices[this.choices.length - 1].emote;
                        emote = emote.substring(2, emote.length - 1);
                        await this.msg.addReaction(emote);
                    }
                    if (values.length > 5) {
                        this.addPagination();
                        await this.msg.addReaction(this.choices[this.choices.length - 2].emote);
                        await this.msg.addReaction(this.choices[this.choices.length - 1].emote);
                    }
                    this.addCancel();
                    await this.msg.addReaction(this.choices[this.choices.length - 1].emote);

                    this.timeout = setTimeout(this.close.bind(this), 10 * 60 * 1000);
                } catch (err) { reject(err); }
            });
        } else {
            this.embed.embed.fields[0].value = choiceString;
            this.embed.embed.fields[0].name = await this.ctx.decode('generic.menu.choices', {
                page: this.page + 1,
                max: Math.floor(values.length / 5) + 1
            });
            await this.msg.edit(this.embed.raw);
        }
    }

    async send() {
        for (const choice of this.choices) {
            if (choice.decode) {
                choice.name = await this.ctx.decode(choice.name);
                choice.description = await this.ctx.decode(choice.description);
            }
            if (choice.name && choice.description)
                this.embed.addField(choice.name, choice.emote + ' ' + choice.description, true);
            if (choice.emote.startsWith('<'))
                choice.emote = choice.emote.substring(2, choice.emote.length - 1);
        }
        this.embed.setTitle('meow');
        this.msg = await this.embed.send();

        for (const emote of this.choices.map(c => c.emote)) {
            await this.msg.addReaction(emote);
        }

        if (!this.client.awaitedReactions[this.ctx.channel.id])
            this.client.awaitedReactions[this.ctx.channel.id] = {};
        this.client.awaitedReactions[this.ctx.channel.id][this.msg.id] = this;

        // Close menu after 10 minutes;
        this.timeout = setTimeout(this.close.bind(this), 10 * 60 * 1000);

        return this;
    }

    close(del = true) {
        clearTimeout(this.timeout);
        this.removeAllListeners();
        if (this.msg) {
            this.client.awaitedReactions[this.ctx.channel.id][this.msg.id] = undefined;
            if (del) this.msg.delete();
        }
    }
}

class MenuBuilder extends BaseHelper {
    constructor(client) {
        super(client);
    }

    build(ctx) {
        return new Menu(this.client, ctx);
    }
}


module.exports = MenuBuilder;
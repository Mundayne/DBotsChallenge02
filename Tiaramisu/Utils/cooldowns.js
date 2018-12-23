'use strict';

const Cooldown = {};
const Moment = require(`moment`);
const { Collection } = require(`discord.js`);

Cooldown.getCooldown = function (Client, commandName, message) {
	if (!Client.cooldowns.has(commandName)) {
		Client.cooldowns.set(commandName, new Collection);
	}

	const now = Moment(Date.now());
	const timestamps = Client.cooldowns.get(commandName);
	const cooldownAmount = Client.COOLDOWN * 1000;

	if (timestamps.has(message.author.id)) {
		const remaining = Moment(timestamps.get(message.author.id) + cooldownAmount);

		if (remaining.diff(now, `milliseconds`) > 0) {
			const msLeft = remaining.diff(now, `milliseconds`) / 1000;
			const timeLeft = Moment.duration(msLeft).humanize();

			return { message: `Please, wait more ${timeLeft} before using ${commandName} again.`, onCooldown: true };
		}
	} else {
		timestamps.set(message.author.id, now);
		setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);		
		return { onCooldown: false };
	}
};

module.exports = Cooldown;
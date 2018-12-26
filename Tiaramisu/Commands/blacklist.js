'use strict';

const SQL = require(`sqlite`);

const Command = {
	name: `blacklist`,
	aliases: [`bl`],
	usage: `Use \`<p>get <user_id> <count>\` to get \`<count>\` last messages of an user`,
	async run(Client, message, args) {
		let target = message.mentions.members.first();

		if (!target) {
			target = args.shift();
		} else {
			target = target.id;
		}

		if (isNaN(target)) return message.channel.send(`This is the correct way of blacklisting someone:\n${this.usage.replace(`<p>`, Client.prefix)}`);

		const Database   = await SQL.open(`./Database/database.sqlite`);
		const inDatabase = await Database.get(`SELECT * FROM users WHERE user_id = ?`, target);

		if (!inDatabase) {
			await Database.run(`INSERT INTO users (user_id, blacklisted) VALUES (?, ?)`, [
				target,
				1
			]);

			// Blkacklisted
			message.channel.send(`User blacklisted succesfully`);
		} else {
			if (inDatabase.blacklisted) {
				// Already blacklisted
				const blfilter = (msg) => [`y`, `yes`, `n`, `no`].includes(msg.content.toLowerCase());
				const collector = message.channel.createMessageCollector(blfilter, { max: 1, time: 8000 });

				message.channel.send(`This user is already blacklisted.\nDo you want to unblacklist them?`);

				collector.on(`collect`, async (msg) => {
					if ([`yes`, `y`].includes(msg.content)) {
						// Unblacklist
						await Database.run(`UPDATE users SET blacklisted = ? WHERE user_id = ?`, [
							0,
							target
						]);

						// Unblacklisted
						message.channel.send(`User unblacklisted succesfully`);
					} else {
						return;
					}
				});
			} else {
				await Database.run(`UPDATE users SET blacklisted = ? WHERE user_id = ?`, [
					1,
					target
				]);
	
				// Blacklisted
				message.channel.send(`User blacklisted succesfully`);
			}
		}

		/* UPSERT Syntax
		Database.run(`INSERT INTO users (user_id, blacklisted) VALUES ($target, $bl) ON CONFLICT (user_id) DO UPDATE SET user_id = $target`, {
			$target: target,
			$bl: 1
		}); */
	}
};

module.exports = Command;
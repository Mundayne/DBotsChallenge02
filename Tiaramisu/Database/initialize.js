'use strict';

const SQL = require(`sqlite`);

const Initialize = {
	async exec() {
		const Database = await SQL.open(`./Database/database.sqlite`);

		await Database.run(`CREATE TABLE IF NOT EXISTS mails (user_id TEXT NOT NULL, mail_content TEXT NOT NULL, abuse INTEGER DEFAULT 0, reason TEXT DEFAULT NULL, timestamp INTEGER NOT NULL)`);
		await Database.run(`CREATE TABLE IF NOT EXISTS users (user_id TEXT NOT NULL, blacklisted INTEGER DEFAULT 0)`);

		await Database.close((err) => {
			if (err !== null) throw new Error(err);
		});
	}
};

module.exports = Initialize;
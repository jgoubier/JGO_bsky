const mysql = require('mysql2/promise');
const moment = require('moment-timezone');
const dote = require('dotenv').config({ path: '/var/www/myapp/config.env' });

// Database connection settings
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

async function collectStats() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        console.log("Connected to database.");

        // Get the latest date in the stats table
        const [latestDateResult] = await connection.execute(
            "SELECT MAX(date) AS latest_date FROM stats"
        );

        let latestDate = latestDateResult[0].latest_date;
        if (!latestDate) {
            // If no stats exist, start from the earliest event
            const [earliestEvent] = await connection.execute(
                "SELECT DATE(MIN(time_us)) AS first_date FROM events"
            );
            latestDate = earliestEvent[0].first_date;
        }

        let currentDate = moment(latestDate).add(1, 'days');
        const today = moment().tz('America/Chicago').startOf('day');

        while (currentDate.isBefore(today)) {
            const dateString = currentDate.format('YYYY-MM-DD');
            console.log(`Computing stats for ${dateString}...`);

            // Compute total users added that day
            const [userCountResult] = await connection.execute(
                `SELECT COUNT(*) AS count FROM events WHERE DATE(time_us) = ?`,
                [dateString]
            );
            const usersAdded = userCountResult[0].count;

            if (usersAdded === 0) {
                console.log(`Skipping ${dateString}, no new users added.`);
                currentDate.add(1, 'days');
                continue;
            }

            // Compute users added per hour
            const [hourlyResults] = await connection.execute(
                `SELECT HOUR(time_us) AS hour, COUNT(*) AS count
                 FROM events WHERE DATE(time_us) = ?
                 GROUP BY hour`,
                [dateString]
            );

            const hourlyUserAdditions = {};
            for (let i = 0; i < 24; i++) {
                hourlyUserAdditions[i] = 0; // Default value
            }
            hourlyResults.forEach(row => {
                hourlyUserAdditions[row.hour] = row.count;
            });

            // Compute daily growth rate
            const [prevWeekResult] = await connection.execute(
                `SELECT AVG(users_added) AS avg_growth FROM stats WHERE date BETWEEN ? AND ?`,
                [
                    moment(dateString).subtract(14, 'days').format('YYYY-MM-DD'),
                    moment(dateString).subtract(8, 'days').format('YYYY-MM-DD')
                ]
            );
            const prevWeekAvg = prevWeekResult[0].avg_growth || 0;
            const dailyGrowthRate = prevWeekAvg ? (usersAdded / prevWeekAvg - 1) * 100 : 0;

            // Compute handle breakdown
            const [bskyCountResult] = await connection.execute(
                `SELECT COUNT(*) AS count FROM events WHERE DATE(time_us) = ? AND handle LIKE '%.bsky.social'`,
                [dateString]
            );
            const bskyPercentage = usersAdded ? (bskyCountResult[0].count / usersAdded) * 100 : 0;

            // Compute domain breakdown
            const [domainResult] = await connection.execute(
                `SELECT RIGHT(handle, LOCATE('.', REVERSE(handle)) - 1) AS domain, COUNT(*) AS count 
                 FROM events WHERE DATE(time_us) = ? AND handle NOT LIKE '%.bsky.social' 
                 GROUP BY domain`,
                [dateString]
            );

            const domainBreakdown = {};
            domainResult.forEach(row => {
                if (row.domain) domainBreakdown[row.domain] = row.count;
            });

            // Country mapping based on domains
            const countryMapping = {
                "at": "Austria", "be": "Belgium", "bg": "Bulgaria", "ch": "Switzerland", "cz": "Czech Republic",
                "de": "Germany", "dk": "Denmark", "ee": "Estonia", "es": "Spain", "eu": "European Union",
                "fi": "Finland", "fr": "France", "uk": "United Kingdom", "gb": "United Kingdom",
                "gr": "Greece", "hr": "Croatia", "hu": "Hungary", "ie": "Ireland", "is": "Iceland", "it": "Italy",
                "li": "Liechtenstein", "lt": "Lithuania", "cn": "China", "jp": "Japan", "in": "India",
                "kr": "South Korea", "au": "Australia", "id": "Indonesia", "th": "Thailand", "ca": "Canada",
                "mx": "Mexico", "br": "Brazil", "ar": "Argentina", "co": "Colombia", "cl": "Chile",
                "pe": "Peru", "za": "South Africa", "ng": "Nigeria", "eg": "Egypt"
            };

            // Compute country breakdown
            const countryBreakdown = {};
            for (const domain in countryMapping) {
                const [countryCountResult] = await connection.execute(
                    `SELECT COUNT(*) AS count FROM events WHERE DATE(time_us) = ? AND handle LIKE ?`,
                    [dateString, `%${domain}`]
                );
                if (countryCountResult[0].count >= 1) {
                    countryBreakdown[countryMapping[domain]] = countryCountResult[0].count;
                }
            }

            // Insert data into stats table
            await connection.execute(
                `INSERT INTO stats (date, users_added, daily_growth_rate, bsky_percentage, domain_breakdown, country_breakdown, hourly_user_additions, country_mapping) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    dateString,
                    usersAdded,
                    dailyGrowthRate,
                    bskyPercentage,
                    JSON.stringify(domainBreakdown),
                    JSON.stringify(countryBreakdown),
                    JSON.stringify(hourlyUserAdditions),
                    JSON.stringify(countryMapping)
                ]
            );
            console.log(`Inserted stats for ${dateString}.`);

            // Move to the next day
            currentDate.add(1, 'days');
        }
    } catch (error) {
        console.error("Error collecting stats:", error);
    } finally {
        await connection.end();
    }
}

collectStats();


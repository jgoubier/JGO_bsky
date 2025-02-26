<?php
$servername = $_SERVER['DB_HOST'];
        $username = $_SERVER['DB_USER'];
        $password = $_SERVER['DB_PASS'];
        $dbname = $_SERVER['DB_NAME'];

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Get last 7 days of user additions
$sql = "SELECT date, users_added, hourly_user_additions, daily_growth_rate, bsky_percentage, domain_breakdown FROM stats ORDER BY date DESC LIMIT 7";
$result = $conn->query($sql);

date_default_timezone_set('America/Chicago');
$dates = [];
$users_added = [];
$hourly_avg = [];
$growth_rate_per_min = [];
$bsky_percentage = 0;
$domain_users = 0;
$domain_percentage = 0;
$domain_categories = ['gov' => 0, 'com' => 0, 'org' => 0, 'edu' => 0, 'eu' => 0];

$gov_domains = ['gov.us', 'gov', 'gov.uk', 'gouv.fr', 'gov.au', 'gov.br', 'gov.cn', 'gc.ca', 'gov.it', 'gov.in', 'go.kr', 'gov.mx', 'gov.ru', 'gov.sg', 'go.jp'];
$com_domains = ['com'];
$org_domains = ['org'];
$edu_domains = ['edu'];
$eu_domains = ['at', 'be', 'bg', 'ch', 'cz', 'de', 'dk', 'ee', 'es', 'eu', 'fi', 'fr', 'uk', 'gr', 'hr', 'hu', 'ie', 'is', 'it', 'li', 'lt'];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $dates[] = date('D-d', strtotime($row['date']));
        $users_added[] = $row['users_added'];
        $hourly_avg[] = array_sum(json_decode($row['hourly_user_additions'], true)) / 24;
        $growth_rate_per_min[] = $row['users_added'] / 1440;

        if (empty($bsky_percentage)) {
            $bsky_percentage = $row['bsky_percentage'];
            $domain_breakdown = json_decode($row['domain_breakdown'], true);
            $domain_users = array_sum($domain_breakdown);
            $domain_percentage = ($domain_users / $row['users_added']) * 100;
            
            foreach ($domain_breakdown as $domain => $count) {
                if (in_array($domain, $gov_domains)) $domain_categories['gov'] += $count;
                elseif (in_array($domain, $com_domains)) $domain_categories['com'] += $count;
                elseif (in_array($domain, $org_domains)) $domain_categories['org'] += $count;
                elseif (in_array($domain, $edu_domains)) $domain_categories['edu'] += $count;
                elseif (in_array($domain, $eu_domains)) $domain_categories['eu'] += $count;
            }
        }
    }
}
$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Statistics</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { width: 800px; height: 420px; font-family: Arial, sans-serif; }
        .container { display: flex; flex-direction: column; height: 100%; }
        .row { display: flex; flex-direction: row; width: 100%; }
        .chart-container { width: 60%; }
        .stats-container { width: 40%; padding: 10px; }
        .trend { font-size: 14px; }
        .green { color: green; }
        .red { color: red; }
    </style>
</head>
<body>
    <div class="container">
        <div class="row">
            <div class="chart-container">
                <canvas id="userChart"></canvas>
            </div>
            <div class="stats-container">
                <p class="trend">Trend: <?= $users_added[0] ?> users (<?= number_format((($users_added[0] - $users_added[1]) / $users_added[1]) * 100, 2) ?>% <span class="<?= $users_added[0] > $users_added[1] ? 'green' : 'red' ?>">&#9650;&#9660;</span>)</p>
                <p>Avg hourly users (7 days): <?= number_format(array_sum($hourly_avg) / 7, 2) ?></p>
                <p>Avg growth per min: <?= number_format($growth_rate_per_min[0], 2) ?> | 1M users in <?= number_format(1000000 / $growth_rate_per_min[0] / 1440, 2) ?> days</p>
            </div>
        </div>
        <div class="row">
            <p>Bsky Percentage (yesterday): <?= number_format($bsky_percentage, 2) ?>%</p>
            <p>Domain users added: <?= $domain_users ?> (<?= number_format($domain_percentage, 2) ?>%)</p>
            <p>Domains (7 days): GOV: <?= $domain_categories['gov'] ?>, COM: <?= $domain_categories['com'] ?>, ORG: <?= $domain_categories['org'] ?>, EDU: <?= $domain_categories['edu'] ?>, EU: <?= $domain_categories['eu'] ?></p>
        </div>
    </div>
    <script>
        const ctx = document.getElementById('userChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: <?= json_encode(array_reverse($dates)) ?>,
                datasets: [{
                    label: 'Users Added',
                    data: <?= json_encode(array_reverse($users_added)) ?>,
                    backgroundColor: 'blue'
                }]
            }
        });
    </script>
</body>
</html>

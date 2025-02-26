<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-DSLJXMQC5K"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-DSLJXMQC5K');
    </script>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=0.7">
    <title>Verified Handle table Tracker</title>
    <style>
        body {
            font-family: Tahoma, sans-serif;
            margin: 0;
            padding: 0;
            color: #ffffff;
        }
        .tables-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            padding: 1px;
        }
        .table-wrapper {
            width: 350px;
            max-width: 400px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 5px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background-color: rgba(255, 255, 255, 0.9);
            font-size: 13px;
        }
        thead {
            display: table;
            width: 100%;
            background-color: #0056b3;
            color: white;
        }
        thead tr {
            height: 80px;
        }
        thead td {
            vertical-align: middle;
        }
        .header-text {
            padding: 10px;
            text-align: left;
            line-height: 1.6;
            font-size: 12px;
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;
        }
        .header-image {
            text-align: right;
            padding-right: 10px;
        }
        .header-image img {
            width: 90px;
            height: auto;
            display: block;
            margin-left: auto;
        }
        tbody {
            display: table;
            width: 100%;
        }
        table td {
            padding: 4px 6px;
            white-space: nowrap;
        }
        tbody tr {
            height: 29px;
        }
        table tr:nth-child(even) {
            background-color: rgba(0, 0, 0, 0.05);
        }
        table tr:hover {
            background-color: rgba(0, 0, 0, 0.1);
        }
        table td:nth-child(1) {
            width: 20px;
            text-align: center;
        }
        table td:nth-child(2) {
            width: 20px;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 30ch;
        }
        table td:nth-child(3) {
            width: 50px;
            text-align: left;
            color: #000000;
        }
        table td img {
            width: 15px;
            height: 14px;
            border-radius: 50%;
            display: block;
            margin: auto;
        }
        .selector-container {
            text-align: center;
            margin: 5px 0 5px 0; /* Adds 20px space above and below */
        }
        select {
            padding: 4px;
            font-size: 16px;
            background-color: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            cursor: pointer;
            border-radius: 5px;
        }    
    </style>
</head>
<body>
    <div class="selector-container">
        <label for="table-selector">Verified handles from </label>
        <select id="table-selector" onchange="window.location.href='?table=' + this.value">
            <option value="gov" <?php if ($_GET['table'] == 'gov' || !isset($_GET['table'])) echo 'selected'; ?>>.gov</option>
            <option value="edu" <?php if ($_GET['table'] == 'edu') echo 'selected'; ?>>.edu</option>
            <option value="org" <?php if ($_GET['table'] == 'org') echo 'selected'; ?>>.org</option>
            <option value="com" <?php if ($_GET['table'] == 'com') echo 'selected'; ?>>.com</option>
            <option value="eur" <?php if ($_GET['table'] == 'eur') echo 'selected'; ?>>.eu</option>
        </select>
    </div>

    <div class="tables-container">
        <?php
        error_reporting(E_ALL);
        ini_set('display_errors', 1);

        $table = isset($_GET['table']) ? $_GET['table'] : 'gov'; // Default to 'gov' if no selection

        $tablesInfo = [
            'gov' => ['domain' => '.gov .gov.us .gov.uk .go.jp...', 'logo' => 'gov_icon.png'],
            'edu' => ['domain' => '.edu .education .uni ...', 'logo' => 'edu_icon.png'],
            'org' => ['domain' => '.org', 'logo' => 'org_icon.png'],
            'com' => ['domain' => '.com', 'logo' => 'com_icon.png'],
            'eur' => ['domain' => '.eu .fr .de .co.uk .nl .ch .es...', 'logo' => 'eur_icon.png']
        ];

        $host = $_SERVER['DB_HOST'];
        $user = $_SERVER['DB_USER'];
        $password = $_SERVER['DB_PASS'];
        $dbname = $_SERVER['DB_NAME'];

        $conn = new mysqli($host, $user, $password, $dbname);
        if ($conn->connect_error) {
            die("Connection failed: " . $conn->connect_error);
        }

        $query1 = "SELECT COUNT(*) AS count FROM $table WHERE time_us >= NOW() - INTERVAL 24 HOUR";
        $result1 = $conn->query($query1);
        $entriesLast24Hours = $result1->fetch_assoc()['count'];

        $hourlyGrowthRate = $entriesLast24Hours / 24;

        $query2 = "SELECT did, handle, TIMESTAMPDIFF(SECOND, time_us, NOW()) AS seconds_ago 
                   FROM $table ORDER BY time_us DESC LIMIT 10";
        $result2 = $conn->query($query2);

        echo "
        <div class='table-wrapper'>
            <table>
                <thead>
                    <tr>
                        <td class='header-text' style='width: 85%; text-align: left;'>
                            <div><strong>In last 24h:</strong> " . $entriesLast24Hours . " new handles</div>
                            <div><strong>Growth Rate:</strong> " . number_format($hourlyGrowthRate, 2) . " per hour</div>
                            <div><strong>Domains:</strong> " . $tablesInfo[$table]['domain'] . "</div>
                        </td>
                        <td class='header-image' style='width: 15%;'>
                            <img src='./" . $tablesInfo[$table]['logo'] . "' alt='{$table} logo'>
                        </td>
                    </tr>
                </thead>
                <tbody>";

        while ($row = $result2->fetch_assoc()) {
            $timeAgo = $row['seconds_ago'];

            if ($timeAgo < 60) {
                $timeDisplay = $timeAgo . "s ago";
            } elseif ($timeAgo < 3600) {
                $timeDisplay = floor($timeAgo / 60) . "m ago";
            } elseif ($timeAgo < 86400) {
                $timeDisplay = floor($timeAgo / 3600) . "h ago";
            } else {
                $timeDisplay = floor($timeAgo / 86400) . "d ago";
            }

            echo "<tr>
                    <td><img src='https://www.google.com/s2/favicons?sz=64&domain={$row['handle']}' alt=''></td>
                    <td><a href='https://bsky.app/profile/{$row['handle']}' target='_blank'>@{$row['handle']}</a></td>
                    <td>$timeDisplay</td>
                  </tr>";
        }

        echo "</tbody>
            </table>
        </div>";

        $conn->close();
        ?>
    </div>
</body>
</html>
<?php

function http_get($url)
{
	$curl = curl_init($url);
	curl_setopt($curl, CURLOPT_FOLLOWLOCATION, TRUE);
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
	$output = curl_exec($curl);
	curl_close($curl);
	return $output;
}

function http_post($url,$data)
{
	$ch = curl_init();
	
	curl_setopt($ch, CURLOPT_URL,$url);
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS,$data);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	
	$server_output = curl_exec ($ch);
	
	curl_close ($ch);
	return $server_output;
}

function http_get_2($url)
{
	return file_get_contents($url);
}


$gas_url = "This is Google Apps Script URL";

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET': $the_request = &$_GET;
        break;
    case 'POST': $the_request = &$_POST;
            $data=json_encode($_REQUEST);
            http_post($gas_url,$data);
        break;
    default:
}

$grade = $the_request['grade'];
$url = "$gas_url?grade=$grade&json";

$json = http_get($url);

$json_a = json_decode($json, true);
$current = $json_a['attendence']['current'];
$date = new DateTime($current['date']);
$previous_date = new DateTime($current['previous_date']);
$names = $current['names'];
?>

<form name="attendance_form" id="attendance_form" action="attendance.php" method="post">
    <input type="hidden" id="grade" name="grade"  value="<? echo $grade ?>" >
    <input type="hidden" id="column" name="column" value="<? echo $current['column'] ?>" >
    <input type="hidden" id="names_total" name="names_total" value="<? echo sizeof($names) ?>" >
    <input type="hidden" id="previous_column" name="previous_column" value="<? echo $current['previous_column'] ?>" >
    <div id="attendence-box_" class="simple-box">
        <h1><? echo $date->format("m/d/Y") ?> <? echo "$grade" ?> Attendance <? $current['testing_flag'] ?></h1>

        <div id="names-box">
            <table>
                <?
                $index=0;
                foreach ($names as $name) {
                    $previous = $name['previous'] ? "*" : "";
                    $present = $name['present'] ? "checked" : "";
                    ?>       
                    <tr>
                        <td><span class=previous_star> <? echo $previous ?> </span></td>
                        <td> <? echo $name['name'] ?> </td>
                        <td> <input type="checkbox" name="present[]" class="present" value="<? echo $index?>" <? echo $present ?> ></td>
                    </tr>
                <? 
                ++$index;
                }
                ?>
            </table>
        </div>
        <div class="total-box">
            <div class="total-section">
                <span class="total-section-title">Last Week <? echo $previous_date->format("m/d") ?></span>Total: &nbsp;
                <span style="font-weight:bold"> <? echo $current['previous_total'] ?></span>.&nbsp;
                <? if ($current['allow_copy']) { ?>
                    <input type="submit" name="Copy" id="copy_button" value="Copy" />
                <? } ?> 
                <br>
                Make current attendance same as last week. * indicate last week attendance
            </div>
            <br>
            <div class="total-section">
                <span class="total-section-title"> Current Week <? echo $date->format("m/d") ?></span> Total: &nbsp;
                <span style="font-weight:bold" id="current_total"><? echo $current['current_total'] ?></span>. &nbsp;
                <input type="submit" name="Update" id="update_button" value="Update" />
                <br>
                Click the checkboxes and click Update button. make sure the total is correct.
            </div>
            <br>
            <p class="clear"></p>
        </div>

        <p class="clear"></p>
    </div>
</form>

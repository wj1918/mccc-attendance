// column and row start from 1
var FIRST_COLUMN=4;
var FIRST_ROW=3;
var GOOGLE_SPREAD_SHEET_ID="This is Google Spreadsheet ID";

var TESTING_KEY="";

/**
 * Special function that handles HTTP GET requests to the published web app.
 * @return {HtmlOutput} The HTML page to be served.
 */
function doGet(request) {
  if(request.parameters.json){
    return doGetJSON(request);
  }else{
    var grade=request.parameters.grade;
    if(isEmpty(grade)){
      var t= HtmlService.createTemplateFromFile('Welcome');
      return t.evaluate()
      .setTitle(' Attendance')
      .setSandboxMode(HtmlService.SandboxMode.NATIVE);
    }else{  
      var t= HtmlService.createTemplateFromFile('Page');
      t.grade=grade;
      return t= t.evaluate()
      .setTitle(grade+' Attendance')
      .setSandboxMode(HtmlService.SandboxMode.NATIVE);
    }
  }
}

// https://script.google.com/macros/s/AKfycbxUlMS-iKUvWXcpSBTYIc0nJoSugGPtYEbXsxJpPgcR/dev
// {"grade":"G2","column":"5","names_total":"10","present":["1","2","3"],"Copy":"Copy"}
function doPost(request){
  var postDataString = request.postData.getDataAsString();
  var obj = Utilities.jsonParse(postDataString);
  if(obj.Copy){
    copyAttendance(obj.grade,obj.previous_column,obj.column,obj.names_total);
  }else if(obj.Update){
    
    var check_list=[].repeat(false,obj.names_total);
    for (index in obj.present){
      check_list[obj.present[index]]=true;
    }
    updateAttendance(obj.grade,obj.column,obj.names_total,check_list);
  }
  return ContentService.createTextOutput("User says: "+JSON.stringify(request));
}

function URLToArray(url) {
  var request = {};
  var pairs = url.substring(url.indexOf('?') + 1).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    request[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return request;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

function isEmpty(data) {
  return (typeof data === "undefined")  || ( typeof(data) == "string" && data.trim() == "" );
}

function lastSunday(d) {
  s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  return s;
}

function previousSunday(d) {
  p = new Date(d);
  p.setDate(p.getDate() - 7);
  return p;
}

// Returns true if the cell where cellData was read from is empty.
// Arguments:
//   - cellData: string
function isCellEmpty(cellData) {
  return typeof(cellData) == "string" && cellData.trim() == "";
}

Date.prototype.sameDateAs = function(pDate){
  return ((this.getFullYear()==pDate.getFullYear())&&(this.getMonth()==pDate.getMonth())&&(this.getDate()==pDate.getDate()));
}

Array.prototype.repeat= function(what, L){
 while(L) this[--L]= what;
 return this;
}

Date.prototype.format = function(format) //author: meizz
{
  var o = {
    "M+" : this.getMonth()+1, //month
    "d+" : this.getDate(),    //day
    "h+" : this.getHours(),   //hour
    "m+" : this.getMinutes(), //minute
    "s+" : this.getSeconds(), //second
    "q+" : Math.floor((this.getMonth()+3)/3),  //quarter
    "S" : this.getMilliseconds() //millisecond
  }

  if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
    (this.getFullYear()+"").substr(4 - RegExp.$1.length));
  for(var k in o)if(new RegExp("("+ k +")").test(format))
    format = format.replace(RegExp.$1,
      RegExp.$1.length==1 ? o[k] :
        ("00"+ o[k]).substr((""+ o[k]).length));
  return format;
}


function getAllStudentNames_(sheet){
  var names=[];
  var values = sheet.getDataRange().getValues();
  for( var row = 2;row< values.length - 1; row++){
    var name=values[row][0];
    if(isCellEmpty(name)){
      break;
    }
    names.push(name);
  }
  return names;
}


function getAttendance(grade){
  var attendSheet = SpreadsheetApp.openById(GOOGLE_SPREAD_SHEET_ID);
  var sheet= attendSheet.getSheetByName(grade);
  var current=getCurrent_(sheet);
  return {
    "sheet": sheet,
    "current": current
  };  
  
}  

function getCurrent_(sheet){
  var sunday=lastSunday(nyDate());
  var values = sheet.getDataRange().getValues();
  var found=false;
  for( var col = FIRST_COLUMN; col<=sheet.getLastColumn(); col++){
    var cellval=values[0][col-1];
    if(isCellEmpty(cellval)){
      break;
    }
    if(new Date(cellval).sameDateAs(sunday)){
      found=true;
      break;
    }
  }
  if(!found){
      sheet.getRange(1, col).setValue(sunday);
  }

  var previous_sunday=previousSunday(sunday);
  var found_previous=false;
  for( var previous_col = FIRST_COLUMN; previous_col <=sheet.getLastColumn(); previous_col ++){
    var cellval=values[0][previous_col-1];
    if(isCellEmpty(cellval)){
      break;
    }
    if(new Date(cellval).sameDateAs(previous_sunday)){
      found_previous=true;
      break;
    }
  }

  var names=[];
  var current_total=0;
  var previous_total=0;
  for( var row = FIRST_ROW -1; row< values.length + FIRST_ROW -2; row++){
    if(typeof values[row] === "undefined"){
      break;
    }
    var name=values[row][0];
    if(isCellEmpty(name)){
      break;
    }
    var present =isPresent_(values,row,col-1);
    current_total+=present ? 1 : 0;
    if(found_previous){
      var previous=isPresent_(values,row,previous_col-1);
      previous_total+=previous? 1:0;
    }
    names.push({"name":name,"present":present,"previous":previous});
  }
  return {"testing_flag":testingFlag(GOOGLE_SPREAD_SHEET_ID),
          "allow_copy":found_previous,
          "date":sunday,
          "column":col,
          "names":names,
          "current_total":current_total,
          "previous_date":previous_sunday,
          "previous_column":previous_col,
          "previous_total":previous_total};
}

function testingFlag(key){
  return GOOGLE_SPREAD_SHEET_ID==TESTING_KEY? "(TESTING)" :"";
}

function isPresent_(values,row,col){
   return values[row][col]=="X" || values[row][col]=="x" ;
}

function updateAttendance(grade,col,len,check_list){
  Logger.log("updateAttendance("+JSON.stringify(arguments)+")");
  var attendSheet = SpreadsheetApp.openById(GOOGLE_SPREAD_SHEET_ID);
  var sheet= attendSheet.getSheetByName(grade);
  var values = check_list.map(function(c){return c==true?["X"]:[""]; });
  var range = sheet.getRange(FIRST_ROW,parseInt(col),values.length);
  range.setValues(values);
  
}

function copyAttendance(grade,previous_column,col,len){
  Logger.log("copyAttendance("+JSON.stringify(arguments)+")");
  if(col!=FIRST_COLUMN){
    var attendSheet = SpreadsheetApp.openById(GOOGLE_SPREAD_SHEET_ID);
    var sheet= attendSheet.getSheetByName(grade);
    var lastWeek = sheet.getRange(FIRST_ROW,previous_column,len);
    var currentWeek = sheet.getRange(FIRST_ROW,col,len);
    lastWeek.copyTo(currentWeek); 
  }
  
}

function getGradeTotal(grade,col,len){
  var attendSheet = SpreadsheetApp.openById(GOOGLE_SPREAD_SHEET_ID);
  var sheet= attendSheet.getSheetByName(grade);
  var range = sheet.getRange(FIRST_ROW,col,len);
  var values =range.getValues();
  var presents=[];
  for (var i = 0; i < values.length; i++) {
    var element = values[i];
    var present=(element=="X" || element=="x" )? true : false;
    presents.push(present);
  }
  return presents;
  
}

function nyDate() {
    var offset=-5;
    d = new Date();
    utc = d.getTime();
    return new Date(utc + (3600000*offset));
}

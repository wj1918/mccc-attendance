function doGetJSON(request) {
  var grade=request.parameters.grade;
  var attend= getAttendance(grade);
  var result = {
    "available": "Yes",
    "attendence": attend
  };
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}


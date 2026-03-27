# Course Statistics Apps Script Contract

Internal endpoint: `POST /api/course-statistics`

Forward target: Google Apps Script Web App

- URL: `https://script.google.com/macros/s/AKfycbzhUcHNYLAKAaugzB8xWw2pe9Z9ZyybFm-gcXNLxqaVEjs9-Enz7p_Z96uVubY3OSMP/exec`
- Spreadsheet ID: `1sisDevoEp3C_dKT1jAnIc3LaW2TgFxxzfEy-Whbc_uI`
- Worksheet: `Course Statistics Responses`

## Apps Script expected payload

The internal endpoint forwards JSON with this shape:

```json
{
  "action": "replace_all_for_coordinator",
  "replaceExistingForCoordinator": true,
  "submittedAt": "2026-03-27T12:34:56.000Z",
  "coordinatorName": "Adegoke, A. M.",
  "spreadsheetId": "1sisDevoEp3C_dKT1jAnIc3LaW2TgFxxzfEy-Whbc_uI",
  "worksheetName": "Course Statistics Responses",
  "institution": {
    "department": "Physics and Engineering Physics",
    "faculty": "Faculty of Science",
    "university": "Obafemi Awolowo University"
  },
  "rows": [
    {
      "Time and Date": "2026-03-27T12:34:56.000Z",
      "Name of Course Coordinator": "Adegoke, A. M.",
      "Course Code": "PHY301",
      "Course Title": "Mathematical Methods of Physics I",
      "Number of Physics Students": 70,
      "Number of Faculty Students": 4,
      "Number of Other Students": 2,
      "Total Number of Students": 76
    }
  ]
}
```

## Internal endpoint request shape

`POST /api/course-statistics` expects:

```json
{
  "coordinatorName": "Adegoke, A. M.",
  "rows": [
    {
      "courseCode": "PHY301",
      "courseTitle": "Mathematical Methods of Physics I",
      "numberOfPhysicsStudents": 70,
      "numberOfFacultyStudents": 4,
      "numberOfOtherStudents": 2,
      "totalNumberOfStudents": 76
    }
  ]
}
```

## Required Apps Script behavior

When `action` is `replace_all_for_coordinator`, the script should:

1. Remove all existing rows in the worksheet where `Name of Course Coordinator` equals `coordinatorName`.
2. Insert all incoming `rows` for that coordinator.
3. Return success (`200`) when replacement completes.

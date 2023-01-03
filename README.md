# NetSuite-Set-Expired-Status
## Project Overview
Insert picture of email

### Purpose
This project automatically sets inventory details to expired when their expiration date has passed using the Inventory Status Change record. It is a scheduled Map/Reduce script that runs every weekday at 9am and sends out a summary email of all the changes made.
### Features
- Automated Emails
- Setting Sublist Field Values
- Automatic Inventory Status Changes
- Saved Searches
### Prerequisites
- SuiteScript/JavaScript
  - Modules: N/search, N/record, N/email
  - SuiteScript Types: Scheduled Script
  - API Version: 2.x
  - JSDoc Tags
- Saved Searches
## Project Setup
### Saved Searches
Be sure to note the saved search ID.
- **Search to Closed PO Items:**
    - **Function:** collects all the open purchase order line items; used to find internal IDs of purchase orders that have closeable line items
    - **Search Type:** Transaction
    - **Criteria:** Record Type starts with purchaseorder, Closed is false, Main Line is false
    - **Result Columns:** Document Number, Item : Name, Closed, Quantity, Quantity Billed, Quantity Fulfilled/Received, Status, Line ID, Internal ID
    - **Permissions:** Public
### Uploading to NetSuite
- **Adding a SuiteScript to the File Cabinet:** navigate Customization>Scripting>Scripts>New; next to the "Script File" dropdown, press the plus sign to upload a new SuiteScript file; select the NetSuite folder that you want to store the SuiteScript files in; under "Select File," press the "Choose File" button; select the SuiteScript file that you want to upload and press open; save and press the blue "Create Script Record" button; name the file, input a relevant ID, and save
## File Descriptions
### set_expired_status.js
- **Programming Languages:** JavaScript, SuiteScript 2.0
- **SuiteScript Type:** Map/Reduce Script, getInputData, map, summarize
- **Description:** sets the status of inventory details with expiration dates that are before today using an Inventory Status Change record
- **Catering the Code to Your NetSuite:**
    - Changing the Saved Search IDs: whenever there is a search load instance (search.load), change the parameter "id" to the correct search ID
    - Sending Email to Different Recipient: find where the email is sent (email.send) at the end of the program; change the "recipients" parameter to the correct email address; add more than one recipient by putting the emails as an array of strings
    - Changing the Email Sender: find where the email is send (email.send) at the end of the program; change the "author" parameter to the correct employee internal ID; find employee internal IDs by navigating Lists>Employees>Employees and locating the correct employee; can only choose one author for the email
- **Deploying SuiteScript:** go to the SuiteScript file; press the "Deploy Script" button; enter a name and relevant ID; change the status to "Testing"; press the blue "Save" button and choose "Save and Execute"; once the code has been tested, change the status to "Scheduled"; under "Execute As Role," choose "Administrator" so that the code will get full access to NetSuite and will not create any permissions errors; under the "Schedule" subtab, choose the schedule that the SuiteScript should execute on (Daily Event, Repeat every weekday, start time 9:00am)
<img width="947" alt="expired_inventory" src="https://user-images.githubusercontent.com/94419306/210435621-ec2aad57-e13b-4e74-93a7-c15e8c4d2cd3.png">

## References
### Helpful Links
- **SuiteScript 2.0:** https://docs.oracle.com/cd/E60665_01/netsuitecs_gs/NSAPI/NSAPI.pdf
- **SuiteScript Modules:** https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/set_1502135122.html
## Extra Tips
- Choose to execute as the administrator role when deploying the SuiteScripts to make sure everyone has full permissions
- Be sure to check the global permission in all of the saved searches
- Go back to the script deployments to check that their status is "Released" and that their audience includes all roles

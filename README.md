# NetSuite-Set-Expired-Status
## Project Overview
<img width="626" alt="statusEmail" src="https://user-images.githubusercontent.com/94419306/211615031-9647d3d7-0119-451e-8a71-3360be0fdd96.png">

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
- **Search for Expired Inventory By Bins:**
    - **Function:** collects all expired inventory details, grouped by their bin numbers, lot numbers, and locations
    - **Search Type:** Inventory Detail
    - **Criteria:** Expiration Date is before today, Status is Good, Inventory Number: Available is greater than 0
    - **Result Columns:** Internal ID, Status, Item, Number, Location, Expiration Date, Inventory Number: Available, Bin Number, Location: Use Bins
    - **Summary Types:** Group the following fields: Status, Item, Number, Location, Expiration Date, Inventory Number: Available, Bin Number, Location: Use Bins
    - **Sort By:** Number, Bin Number, Location
    - **Filters:** Number, Bin Number, Item
    - **Permissions:** Public
- **Search for Expired Status Changes:**
    - **Function:** collects all the Inventory Status Change records that were automatically created
    - **Search Type:** Transaction
    - **Criteria:** Type is Inventory Status Change, Date is on today, Main Line is false
    - **Result Columns:** Inventory Detail: Number, Inventory Detail: Expiration Date, Inventory Detail: Item
    - **Summary Types:** Group the following fields: Inventory Detail: Number, Inventory Detail: Expiration Date, Inventory Detail: Item
    - **Sort By:** Inventory Detail: Number, Inventory Detail: Bin Number, Inventory Detail: Location
    - **Permissions:** Public
- **Search for Expired Quantity:**
    - **Function:** finds the quantity available in each bin; bin number, item, location, and lot number filters are applied to this to find the bin quantity
    - **Search Type:** Item
    - **Criteria:** Inventory Number/Bin on Hand: Available is greater than 0
    - **Result Columns:** Inventory Number/Bin on Hand: Inventory Number, Inventory Number/Bin on Hand: Bin Number, Inventory Number/Bin on Hand: Location, Inventory Number/Bin on Hand: Available
    - **Sort By:** Inventory Number/Bin on Hand: Inventory Number, Inventory Number/Bin on Hand: Bin Number, Inventory Number/Bin on Hand: Location
    - **Filters:** Inventory Detail: Status, Name, Inventory Number/Bin on Hand: Inventory Number, Inventory Number/Bin on Hand: Bin Number, Inventory Number: Expiration Date, Inventory Number/Bin on Hand: Location
    - **Permissions:** Public
- **Search for Expired Inventory:**
    - **Function:** collects all the expired inventory and the bin available quantities; Inventory Balance search types cannot be used in SuiteScript
    - **Search Type:** Inventory Balance
    - **Criteria:** Inventory Number: Expiration Date is before today, Status is Good, Available is greater than 0
    - **Result Columns:** Status, Item, Inventory Number, Bin Number, Location, Inventory Number: Expiration Date, Available
    - **Sort By:** Inventory Number, Bin Number, Location
    - **Permissions:** Public
### Uploading to NetSuite
- **Adding a SuiteScript to the File Cabinet:** navigate Customization>Scripting>Scripts>New; next to the "Script File" dropdown, press the plus sign to upload a new SuiteScript file; select the NetSuite folder that you want to store the SuiteScript files in; under "Select File," press the "Choose File" button; select the SuiteScript file that you want to upload and press open; save and press the blue "Create Script Record" button; name the file, input a relevant ID, and save
### Adding New Inventory Status
- **Adding Expired Status to Inventory Status List:** navigate List>Supply Chain>Inventory Statuses>New; input the name of the new Inventory Status as "Expired"; uncheck the boxes labeled "Making Inventory Available for Commitment" and "Make Inventory Available for Allocation and Planning"; save the new record by pressing the blue button
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

/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/email', 'N/url'], function(search, record, email, url){
    function getInputData(){
        return search.load({
            id: 'customsearchexpired_bins'          //gets expired inventory details grouped by bins
        });
    }
    function map(context){
        var searchResult = JSON.parse(context.value);           //get search result values
        log.error("Result", searchResult);
        var location = searchResult.values["GROUP(location)"].value;
        var prevStatus = searchResult.values["GROUP(status)"].value;
        var itemId = searchResult.values["GROUP(item)"].value;
        var itemtxt = searchResult.values["GROUP(item)"].text;
        var lotNum = searchResult.values["GROUP(inventorynumber)"].value;
        var lotTxt = searchResult.values["GROUP(inventorynumber)"].text;
        var binNum = searchResult.values["GROUP(binnumber)"].value;
        var useBins = searchResult.values["GROUP(usesbins.location)"];
        var quantity = searchResult.values["GROUP(quantityavailable.inventoryNumber)"];     //use quantity available if location doesn't use bins
        if(useBins == "T" || useBins == true){
            quantity = getBinQuantity(location, itemtxt, lotTxt, binNum);           //use bin quantity if location uses bins
        }
        createInventoryStatusChange(location, prevStatus, itemId, lotNum, binNum, quantity);        //create inventory status change record with imported data
    }
    function getBinQuantity(location, itemtxt, lotTxt, binNum){
        var quantitySearch = search.load({
            id: "customsearchexpired_quantity"
        });
        var itemFilter = search.createFilter({      //add filters to search to find specific bin/lot/item
            name: "itemid",
            operator: search.Operator.IS,
            values: [itemtxt]
        });
        quantitySearch.filters.push(itemFilter);
        var lotFilter = search.createFilter({
            name: "inventorynumber",
            join: "inventoryNumberBinOnHand",
            operator: search.Operator.IS,
            values: [lotTxt]
        });
        quantitySearch.filters.push(lotFilter);
        if(location == 2 || location == "2"){
            var binFilter = search.createFilter({
                name: "binnumber",
                join: "inventoryNumberBinOnHand",
                operator: search.Operator.IS,
                values: [parseInt(binNum)]
            });
            quantitySearch.filters.push(binFilter);
        }
        var locationFilter = search.createFilter({
            name: "location",
            join: "inventoryNumberBinOnHand",
            operator: search.Operator.IS,
            values: [parseInt(location)]
        });
        quantitySearch.filters.push(locationFilter);
        var firstResult = quantitySearch.run().getRange({
            start: 0,
            end: 1
        })[0];
        var quantity = firstResult.getValue({       //get bin quantity from first/only search result
            name: "quantityavailable",
            join: "inventoryNumberBinOnHand"
        });
        return quantity;
    }
    function createInventoryStatusChange(location, prevStatus, itemId, lotNum, binNum, quantity, newStatus){
        var parentRecord = record.create({                  //create inventory status change record
            type: record.Type.INVENTORY_STATUS_CHANGE,
            isDynamic: true
        });
        parentRecord.setValue({             //set body values
            fieldId: 'location',
            value: parseInt(location)
        });
        parentRecord.setValue({
            fieldId: "previousstatus",
            value: parseInt(prevStatus)
        });
        parentRecord.setValue({
            fieldId: "revisedstatus",
            value: parseInt(newStatus)
        });
        parentRecord.selectNewLine({
            sublistId: "inventory"
        });
        parentRecord.setCurrentSublistValue({
            sublistId: "inventory",
            fieldId: "item",
            value: parseInt(itemId)
        });
        parentRecord.setCurrentSublistValue({
            sublistId: "inventory",
            fieldId: "quantity",
            value: parseInt(quantity)
        });

        var subRecordData = createSubrecord(parentRecord, lotNum, binNum, quantity);        //create subrecord

        if(subRecordData.added){
            log.error("Saving Record");
            subRecordData.parentRecord.commitLine({       //save record and subrecord if all fields were completed
                sublistId: "inventory"
            });
            subRecordData.parentRecord.save();
        }
        else{
            log.error("Unable to commit subrecord");
            subRecordData.parentRecord.cancelLine({           //delete subrecord if fields not complete
                sublistId:"inventory"
            });
        }
    }
    function createSubrecord(parentRecord, lotNum, binNum, quantity){
        var subRecord = parentRecord.getCurrentSublistSubrecord({       //create inventory detail subrecord
            sublistId: "inventory",
            fieldId: "inventorydetail"
        });
        subRecord.selectNewLine({
            sublistId: "inventoryassignment"
        });
        try{
            subRecord.setCurrentSublistValue({      //try to add lot number
                sublistId: "inventoryassignment",
                fieldId: "issueinventorynumber",
                value: parseInt(lotNum)
            });
        }
        catch(err){
            log.error("Lot Number not an option");      //break if lot number not added
            return {
                "added": false,
                "parentRecord": parentRecord,
                "subRecord": subRecord
            };
        }
        var index = subRecord.getCurrentSublistIndex({
            sublistId: "inventoryassignment"
        });
        try{            //try to add bin number
            subRecord.getSublistField({             //check if bin number field exists
                sublistId: "inventoryassignment",
                fieldId: "binnumber",
                line: index
            });
            try{
                subRecord.setCurrentSublistValue({      //add bin number if it exists
                    sublistId: "inventoryassignment",
                    fieldId: "binnumber",
                    value: parseInt(binNum)
                });
            }
            catch(err){
                log.error("Bin number not an option");      //break if bin number not added
                return {
                    "added": false,
                    "parentRecord": parentRecord,
                    "subRecord": subRecord
                };
            }
        }
        catch(err){
            log.error("Bin number not needed");
        }
        try{
            subRecord.setCurrentSublistValue({          //set quantity if valid
                sublistId: "inventoryassignment",
                fieldId: "quantity",
                value: parseInt(quantity)
            });
            subRecord.commitLine({
                sublistId: "inventoryassignment"
            });
        }
        catch(err){
            log.error("Invalid Quantity");          //break if quantity invalid
            return {
                "added": false,
                "parentRecord": parentRecord,
                "subRecord": subRecord
            };
        }
        return {                //return with added = true
            "added": true,
            "parentRecord": parentRecord,
            "subRecord": subRecord
        };
    }
    function summarize(summary){
        const items = [];
        const lots = [];
        const dates = [];
        const urls = [];
        var emailBody = "";
        var changesSearch = search.load({               //searches for items that were set to expired today
            id: 'customsearchinv_status_change'
        });
        changesSearch.run().each(function(result){
            if(result != null && result != ''){
                var currentLot = result.getText({
                    name: "inventorynumber",
                    join: "inventorydetail",
                    summary: "GROUP"
                });
                var lotId = result.getValue({
                    name: "inventorynumber",
                    join: "inventorydetail",
                    summary: "GROUP"
                });
                var currentURL = url.resolveRecord({
                    recordType: "inventorynumber",
                    recordId: parseInt(lotId),
                    isEditMode: true
                });
                var currentItem = result.getText({
                    name: "item",
                    join: "inventorydetail",
                    summary: "GROUP"
                });
                var currentDate = result.getValue({
                    name: "expirationdate",
                    join: "inventorydetail",
                    summary: "GROUP"
                });
                items.push(currentItem);        //add item data to arrays
                lots.push(currentLot);
                dates.push(currentDate);
                urls.push(currentURL);
            }
            return true;
        });
        if(items.length > 0){            //execute if inventory statuses were changed
            emailBody = "<b>The Following Inventory Has Been Set to Expired:</b><br><br>";
            for(var i = 0; i < items.length; i++){
                var currentItem = items[i].toString();
                var currentLot = lots[i].toString();
                var currentDate = dates[i].toString();
                var currentURL = urls[i].toString();
                emailBody += " - <b><a href=" + currentURL + ">" + currentItem + "</a></b>: Lot " + currentLot + " (Expired " + currentDate + ")<br>";
            }
            try{
                email.send({
                    author: -5,		//internal ID of user
                    recipients: ["fakeemail@gmail.com"],
                    subject: "Expired Inventory Notification",
                    body: emailBody
                });
                log.error("Email", emailBody);
                log.error("Email Sent");
            }
            catch(err){
                log.error("Email", emailBody);
                log.error("Email was not sent");
            }
        }
        log.error("Number of Items Changed", items.length);      //log the number of inventory statuses changed
    }
    return{
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});

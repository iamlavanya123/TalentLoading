import { LightningElement, track, wire, api } from 'lwc';
import createTalentRecords from '@salesforce/apex/saveTalentLoading.createTalentRecords';
import getTalentLoadings from '@salesforce/apex/saveTalentLoading.getTalentLoadings';
import updateTalentFrequency  from '@salesforce/apex/saveTalentLoading.updateTalentFrequency';
import updateTalentFrequencyToZero  from '@salesforce/apex/saveTalentLoading.updateTalentFrequencyToZero'
import deleteTalentLoadings  from '@salesforce/apex/saveTalentLoading.deleteTalentLoadings';
import deleteTalentLoadingsTeamAlloc  from '@salesforce/apex/saveTalentLoading.deleteTalentLoadingsTeamAlloc';
import getProject from '@salesforce/apex/saveTalentLoading.getProject';
import getTeamAllocations from '@salesforce/apex/saveTalentLoading.getTeamAllocations';
import getCustomSettingValue from '@salesforce/apex/saveTalentLoading.getCustomSettingValue';
import getProjectType from '@salesforce/apex/saveTalentLoading.getProjectType';
import modalwidthstyle from '@salesforce/resourceUrl/talentLoadingCss';
import showmodalstyle from '@salesforce/resourceUrl/showmodalstyle';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import TALENT_OBJECT from '@salesforce/schema/Talent_Loading__c';
import PROJECT_OBJECT from '@salesforce/schema/Project__c';
import ROLE_FIELD from '@salesforce/schema/Talent_Loading__c.Role__c';
import FREQ_FIELD from '@salesforce/schema/Project__c.Talent_Frequency__c';
import LOC_FIELD from '@salesforce/schema/Talent_Loading__c.Location__c';
import { getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
import PRONAME_FIELD from '@salesforce/schema/Project__c.Name';
import PROSTART_DATE_FIELD from '@salesforce/schema/Project__c.Start_Date__c';
import PROEND_DATE_FIELD from '@salesforce/schema/Project__c.End_Date__c';
import PROBUDGET_FIELD from '@salesforce/schema/Project__c.Budgeted_Hours__c';
import PROVERSION_FIELD from '@salesforce/schema/Project__c.TalentloadVersion__c';
import PROTYPE_FIELD from '@salesforce/schema/Project__c.Project_Type__c';
import { loadStyle } from 'lightning/platformResourceLoader';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';
import { CloseActionScreenEvent } from 'lightning/actions';
import { NavigationMixin } from 'lightning/navigation';



export default class CustomDatatableDemo extends NavigationMixin(LightningElement) {

    teamAllocations;
    @api recordId;
    showModal = false;
    showWeekly = false;
    showMonthly = false;
    showSavePopUp = false;  
    showDeletePopupTimeSheet = false;
    showDeletePopupTeamAlloc = false;
    customSettingValue;
    record;
    role;
    hour;
    location;
    totalrow = 0;
    projectType;    
    @track weeks  = [];
    @track months = [];
    @track rolePicklistValues = [];
    @track tableData = [];
    @track isAllSelected = false;
    @track columnTotals = [];
    @track columnTotalsWeekly = [];
    @track cengagement;
    @track talentHours = 0;
    talentrecords;
    isTalentLoaded = false;
    isLoading = false; 
    totalValue;
    
    async defaultRows() {
        console.log("Inside");
       
    await this.generateMonths();

        for (let i = 1; i <= this.customSettingValue ; i++) {
            const monthsData = this.months.map((month) => ({ month, value: 0 }));
            this.tableData.push({
                id: i,
                column1: '', // Get the desired role value for each row
                column2: '',
                monthsData: monthsData,
                isSelected: false,
                total: this.totalrow.toFixed(2)
                // Add more properties as needed
            });
        }
        console.log(JSON.stringify(this.tableData));
    }

    async defaultRowsWeekly() {
        await this.generateWeeks();
      
        for (let i = 1; i <= this.customSettingValue ; i++) {
            const weeksData = this.weeks.map((week) => ({ month: week, value: 0 }));
            this.tableData.push({
                id: i,
                column1: '',
                column2: '',
                monthsData: weeksData,
                isSelected: false,
                total: this.totalrow.toFixed(2)
            });
        }
        console.log(JSON.stringify(this.tableData));
    }
    

    @wire(getProjectType, { recordId: '$recordId' })
    handleGetProjectType({ error, data }) {
        if (data) {
            this.projectType = data;
        } else if (error) {
            // Handle error
        }
    }
    
    @wire(getCustomSettingValue)
    wiredCustomSettingValue({ error, data }) {
        if (data) {
            this.customSettingValue = data;
            
            console.log("custom"+this.customSettingValue);
        } else if (error) {
            // Handle error
            console.log('error');
        }
    }
    
    @wire(getTeamAllocations, { projId: '$recordId' })
    wiredTeamAllocations({ error, data }) {
        if (data) {
            // Assign the retrieved TeamAllocation records to the teamAllocations property
            this.teamAllocations = data;
        } else if (error) {
            // Handle error
            console.error('Error retrieving TeamAllocations:', error);
        }
    }

    hasMappedTalentLoadings() {
        // Check if any TeamAllocation records have mapped TalentLoading records
        const hasMappedRecords = this.teamAllocations && this.teamAllocations.some(teamAllocation => {
            // Check if Talent_Loading__c field is not empty or null
            return teamAllocation.Talent_Loading__c !== undefined && teamAllocation.Talent_Loading__c !== null && teamAllocation.Talent_Loading__c !== '';
        });
    
        return hasMappedRecords;
    }
    

       

    renderedCallback() {
       

    if(this.showModal == true){
        Promise.all([
            loadStyle(this, showmodalstyle)
        ]).then(() => {
            console.log('Files loaded');

        }).catch(error => {
            console.log(error.body.message);
        });


    }

    if(this.showModal == false){
        Promise.all([
            loadStyle(this, modalwidthstyle)
        ]).then(() => {
            console.log('Files loaded');

        }).catch(error => {
            console.log(error.body.message);
        });


    }
}

calculateRowTotals() {
    this.tableData.forEach((row) => {
      let total = 0;
      row.monthsData.forEach((monthData) => {
        const value = parseFloat(monthData.value);
        if (!isNaN(value)) {
          total += value;
        }
      });
      row.total = total.toFixed(2);
    });
  }
  
  // Calculate the total value and update the totalValue property
calculateTotal() {
    let total = 0;
    this.tableData.forEach((row) => {
        total += parseFloat(row.total);
    });
    this.totalValue = total.toFixed(2);
}



    calculateColumnTotals() {
        this.columnTotals = this.months.map(month => {
            const total = this.tableData.reduce((acc, row) => {
                if (row.isSelected) return acc; // Skip selected rows
                const monthData = row.monthsData.find(data => data.month === month);
                if (monthData) {
                    const value = parseFloat(monthData.value);
                    if (!isNaN(value)) {
                        return acc + value;
                    }
                }
                return acc;
            }, 0);
            return total.toFixed(2);
        });

        // Calculate the total talent hours
        this.talentHours = this.columnTotals.reduce((acc, total) => acc + parseFloat(total), 0).toFixed(2);
        if(this.talentHours > this.budgetHours){
            const toastEvent = new ShowToastEvent({
                title: 'Error',
                message: 'Talent Hours cannot be greater than Budgeted Hours',
                variant: 'error',
            });
            this.dispatchEvent(toastEvent);

        }
    }


    calculateColumnTotalsWeekly() {
        this.columnTotalsWeekly = this.weeks.map((week) => {
            const total = this.tableData.reduce((acc, row) => {
                if (row.isSelected) return acc;
                const weekData = row.monthsData.find((data) => data.month === week);
                if (weekData) {
                    const value = parseFloat(weekData.value);
                    if (!isNaN(value)) {
                        return acc + value;
                    }
                }
                return acc;
            }, 0);
            return total.toFixed(2);
        });
    
        this.talentHours = this.columnTotalsWeekly.reduce((acc, total) => acc + parseFloat(total), 0).toFixed(2);
        if (this.talentHours > this.budgetHours) {
            const toastEvent = new ShowToastEvent({
                title: 'Error',
                message: 'Talent Hours cannot be greater than Budgeted Hours',
                variant: 'error',
            });
            this.dispatchEvent(toastEvent);
        }
    }
    





    @wire(getObjectInfo, { objectApiName: TALENT_OBJECT })
    talentInfo;

    @wire(getObjectInfo, { objectApiName: PROJECT_OBJECT })
    projectInfo;

    @wire(getPicklistValues,
        {
            recordTypeId: '$projectInfo.data.defaultRecordTypeId',
            fieldApiName: FREQ_FIELD
        }
    )
    leadSourceValues;

    @wire(getPicklistValues,
        {
            recordTypeId: '$talentInfo.data.defaultRecordTypeId',
            fieldApiName: ROLE_FIELD
        }
    )
    roleValues;



    @wire(getPicklistValues,
        {
            recordTypeId: '$talentInfo.data.defaultRecordTypeId',
            fieldApiName: LOC_FIELD
        }
    )
    locValues;

    handleSelect(event) {
        const rowId = event.target.dataset.rowId;
        const selectedRow = this.tableData.find(row => row.id === parseInt(rowId, 10));
        selectedRow.isSelected = event.target.checked;
        this.isAllSelected = this.tableData.every(row => row.isSelected);
    }


    handleSelectAll(event) {
        const isChecked = event.target.checked;

        this.isAllSelected = isChecked;
        this.tableData = this.tableData.map(row => ({
            ...row,
            isSelected: event.target.checked
        }));

    }
    showConfirmationModal = false;

    // Modify the deleteAll method
    deleteAll() {
        const hasMappedRecords = this.hasMappedTalentLoadings();
    
        if (hasMappedRecords) {
    const mappedTeamAllocations = this.teamAllocations.filter(teamAllocation => {
        console.log("Hello" + teamAllocation.Id);
        return teamAllocation.Talent_Loading__c !== undefined && teamAllocation.Talent_Loading__c !== null && teamAllocation.Talent_Loading__c !== '';
    });

    let hasTimesheetActivity = false;
    mappedTeamAllocations.forEach(teamAllocation => {
        // Check if there are related Timesheet Activity records
        if (teamAllocation.Delivery_Team_Timesheets__r !== undefined && teamAllocation.Delivery_Team_Timesheets__r.length > 0) {
            hasTimesheetActivity = true;
        }
    });

    if (hasTimesheetActivity) {
        // Show an error toast message
        this.showDeletePopupTimeSheet  = true;
        return; // Exit the method to prevent deletion
    }
    else if(hasMappedRecords && !(hasTimesheetActivity)){
        this.showDeletePopupTeamAlloc = true;
        return;
    }
}
       
    
    
   

    
    //1. If TalentLoading is Mapped to Team Allocation show confirmation window if yes delete team Allocation and talent records
    //2. If TalentLoading is Mapped to Team Allocation and if that is mapped to Timesheet show toast we can't delete
    //3. Otherwise delete

      // Show the confirmation modal
      this.showConfirmationModal = true;
    }

    deleteCancel(){
        this.showConfirmationModal = false; 
        this.showDeletePopupTeamAlloc =false;
    }
    
    url = window.location.href;
    // Add a new method to handle the confirmation
    handleConfirmation(event) {
        this.isLoading = true;
            // Replace with the actual Project record Id
            deleteTalentLoadings({ projectId: this.recordId})
                .then(() => {
                    // Show success toast message
                    const toastEvent = new ShowToastEvent({
                        title: 'Success',
                        message: 'Talent Loading records deleted successfully.',
                        variant: 'success',
                    });
                    this.dispatchEvent(toastEvent);
                   
                    this[NavigationMixin.GenerateUrl]({
                        
                        type: 'standard__recordPage',
                        attributes: {
                            recordId: this.recordId,
                            actionName: 'view'
                        }
                        
                    }).then(url => {
                        window.location.href = url;
                      }).catch(error => {
                        // Handle the error
                        console.error(error);
                      });
                      this.isLoading = false;
                })
                .catch((error) => {
                    // Show error toast message
                    const toastEvent = new ShowToastEvent({
                        title: 'Error',
                        message: 'An error occurred while deleting Talent Loading records.',
                        variant: 'error',
                    });
                    this.dispatchEvent(toastEvent);
                    console.error(error);
                    this.isLoading = false;
                });
        
        // Hide the confirmation modal
        this.showConfirmationModal = false;
    }


    handleConfirmationTeamAlloc(event){
        console.log("Delete Team Allocation");
        this.isLoading = true;
        // Replace with the actual Project record Id
        deleteTalentLoadingsTeamAlloc({ projectId: this.recordId})
            .then(() => {
                // Show success toast message
                const toastEvent = new ShowToastEvent({
                    title: 'Success',
                    message: 'Talent Loading and related Team Allocation records deleted successfully.',
                    variant: 'success',
                });
                this.dispatchEvent(toastEvent);
               
                this[NavigationMixin.GenerateUrl]({
                    
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: this.recordId,
                        actionName: 'view'
                    }
                    
                }).then(url => {
                    window.location.href = url;
                  }).catch(error => {
                    // Handle the error
                    console.error(error);
                  });
                  this.isLoading = false;
            })
            .catch((error) => {
                // Show error toast message
                const toastEvent = new ShowToastEvent({
                    title: 'Error',
                    message: 'An error occurred while deleting Talent Loading and related Team Allocations records.',
                    variant: 'error',
                });
                this.dispatchEvent(toastEvent);
                console.error(error);
                this.isLoading = false;
            });
    
    // Hide the confirmation modal
    this.showConfirmationModal = false;
    }
    handleHoursChange(event) {
        const rowId = event.target.dataset.rowId;
        console.log('rowId'+rowId)
        const month = event.target.dataset.month;
        console.log('month'+month);
        const hours = parseFloat(event.target.value);
        console.log('hours'+hours);
        const selectedRow = this.tableData.find(row => row.id === parseInt(rowId, 10));
        console.log('selectedRow'+selectedRow);
        let monthDataToUpdate = selectedRow.monthsData.find(monthData => monthData.month === month);
        console.log('monthDataToUpdate'+monthDataToUpdate);
        if (!monthDataToUpdate) {
            // Create a new monthData object if it doesn't exist for the specified month
            monthDataToUpdate = {
                month: month,
                value: hours
            };
            selectedRow.monthsData.push(monthDataToUpdate);
            console.log('inside if selected row'+JSON.stringify(selectedRow));
        } else {
            // Update the value if the monthData object already exists
            monthDataToUpdate.value = hours;
            console.log('monthDataToUpdate'+monthDataToUpdate);
        }

        console.log(selectedRow.monthsData);
        this.calculateColumnTotals();
        this.calculateRowTotals(); 
        this.calculateTotal();

    }
    handleHoursChangeWeekly(event) {
        const rowId = event.target.dataset.rowId;
        const month = event.target.dataset.month;
        const hours = parseFloat(event.target.value);
        const selectedRow = this.tableData.find((row) => row.id === parseInt(rowId, 10));
        let monthDataToUpdate = selectedRow.monthsData.find((monthData) => monthData.month === month);
    
        if (!monthDataToUpdate) {
            monthDataToUpdate = {
                month: month,
                value: hours,
            };
            selectedRow.monthsData.push(monthDataToUpdate);
        } else {
            monthDataToUpdate.value = hours;
        }
        
        this.calculateColumnTotalsWeekly();
        this.calculateRowTotals(); 
        this.calculateTotal();
    }

   
frequency;
    handleFrequencyChange(event) {
        this.frequency = event.detail.value;
        console.log(this.frequency);
    }

    handleNext(event) {
        updateTalentFrequency({ recordId: this.recordId, talentFrequency: this.frequency })
        .then(() => {
            // Show toast message or perform any other action
            console.log('Frequency Updated');
        })
        .catch(error => {
            // Handle the error
            console.log(error);
        });
  
        console.log(this.frequency);
        if (this.frequency == 'Monthly') {
            this.talentFrequency = 'Monthly';
            this.showModal = false;
            this.showWeekly = false;
            this.showMonthly =true;
            this.defaultRows();
            
        } else if (this.frequency == 'Weekly') {
            this.talentFrequency = 'Weekly';
            this.showModal = false;
            this.showWeekly = true;
            this.showMonthly =false;
            this.defaultRowsWeekly();
        }
    
      
       
    }
    
    handleRoleChange(event) {
        const rowId = event.target.dataset.rowId;
        const selectedRow = this.tableData.find(row => row.id === parseInt(rowId, 10));
        selectedRow.column1 = event.detail.value;
    }

    handleLocationChange(event) {
        const rowId = event.target.dataset.rowId;
        const selectedRow = this.tableData.find(row => row.id === parseInt(rowId, 10));
        selectedRow.column2 = event.detail.value;
    }


    


    @wire(getTalentLoadings, { recId: '$recordId' })
    wiredTalentRecords({ error, data }) {
        if (data) {
            setTimeout(() => {
                console.log('setTimeout');
                this.talentrecords = data;
                console.log("Retrieving Data");
                console.log(this.recordId);
                console.log(this.frequency);
                console.log(this.profrequency);
                console.log(this.talentFrequency);
                 if (this.talentrecords.length !== 0) {
                    // this.frequency = 'Monthly';
                     console.log(JSON.stringify(this.months));
                     console.log('this.talentrecords' + JSON.stringify(this.talentrecords));
                     for (let i = 0; i < this.talentrecords.length; i++) {
                         if(this.frequency == 'Monthly'  || this.profrequency == 'Monthly' || this.talentFrequency == 'Monthly'){
                             console.log('Inside the monthly part');
                         const newRow = {
                             id: i + 1,
                             column1: this.talentrecords[i].Role__c,
                             column2: this.talentrecords[i].Location__c,
                             monthsData: this.months.reduce((data, month) => {
                                 const line = this.talentrecords[i].Talent_Loading_Lines__r.find((line) => {
                                     
                                         return line.Month__c === month;
                                    
                                 });
                                 data.push({ month: month, value: line ? line.Hours__c : 0});
                                 return data;
                             }, []),
                         };
                         this.tableData.push(newRow);
                     }
                    
                     else if(this.frequency == 'Weekly'  || this.profrequency == 'Weekly' || this.talentFrequency == 'Weekly'){
                         console.log('Inside the weekly part');
                         const newRow = {
                             id: i + 1,
                             column1: this.talentrecords[i].Role__c,
                             column2: this.talentrecords[i].Location__c,
                             monthsData: this.weeks.reduce((data, month) => {
                                 const line = this.talentrecords[i].Talent_Loading_Lines__r.find((line) => {
                                    
                                         return line.Week__c === month;
                                     
                                 });
                                 data.push({ month: month, value: line ? line.Hours__c : 0 });
                                 return data;
                             }, []),
                         };
                         this.tableData.push(newRow);
                     }
                     }
     
                     console.log(JSON.stringify(this.tableData));
     
                     if (this.profrequency === 'Monthly') {
                         this.frequency = this.profrequency;
                         this.calculateColumnTotals();
                         this.calculateRowTotals();
                         this.calculateTotal(); 
                     } else if (this.profrequency === 'Weekly') {
                         this.frequency = this.profrequency;
                         this.calculateColumnTotalsWeekly();
                         this.calculateRowTotals(); 
                         this.calculateTotal();
                     }
                 }
              },500); 
          
            // } else {
            //     if (this.profrequency === 'Monthly') {
            //         this.defaultRows();
            //     } else {
            //         this.defaultRowsWeekly();
            //     }
            //     console.log('Else part');
            // }
        } else if (error) {
            console.log(error);
        }
    }

        
    


    @wire(getRecord, { recordId: '$recordId', fields: [PRONAME_FIELD, PROSTART_DATE_FIELD, PROEND_DATE_FIELD, PROBUDGET_FIELD, PROTYPE_FIELD, PROVERSION_FIELD ,FREQ_FIELD] })
    wiredRecord({ error, data }) {
        if (data) {
            this.record = data;
            const talentFrequency = getFieldValue(this.record, FREQ_FIELD);
            if(this.frequency == 'Monthly'  || this.profrequency == 'Monthly' || this.talentFrequency == 'Monthly'){
                this.generateMonths();
            }
            else if(this.frequency == 'Weekly'  || this.profrequency == 'Weekly' || this.talentFrequency == 'Weekly'){
                this.generateWeeks();
            }
            
          
            const projectVersion = getFieldValue(this.record, PROVERSION_FIELD);
        if (projectVersion === 0 || projectVersion == null) {
            this.showModal = true;
        }
        
        if (talentFrequency === 'Monthly' && (projectVersion!=0 && projectVersion!= null)) {
            this.showMonthly = true;
        } else if (talentFrequency === 'Weekly' &&(projectVersion!=0 && projectVersion!= null)) {
            this.showWeekly = true;
        }
        } else if (error) {
            console.error(error);
        }
    }

    
    get recordName() {
        return getFieldValue(this.record, PRONAME_FIELD);
    }

    get startDate() {
        return getFieldValue(this.record, PROSTART_DATE_FIELD);
    }

    get endDate() {
        return getFieldValue(this.record, PROEND_DATE_FIELD);
    }

    get budgetHours() {
        return getFieldValue(this.record, PROBUDGET_FIELD);
    }

    // get projectType() {
    //     return getFieldValue(this.record, 'Type__c');
    //   }

    get version(){
        return getFieldValue(this.record, PROVERSION_FIELD);
    }

    get profrequency(){
        console.log('call@@');
        return getFieldValue(this.record, FREQ_FIELD);
    }

    generateMonths() {
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        const months = [];
        let current = new Date(start.getFullYear(), start.getMonth(), 1);
        while (current <= end) {
            months.push(current.toLocaleString('default', { month: 'short' }) + '-' + current
                .getFullYear()
                .toString()
                .substr(-2)
            );
            current.setMonth(current.getMonth() + 1);
        }
        this.months = months;
        console.log('this.months@@'+this.months);

        this.calculateColumnTotals();
        this.calculateRowTotals(); 
        this.calculateTotal();
    }


    generateWeeks() {
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        const weeks = [];
        let current = start;
        let weekNumber = 0 ;
        while (current <= end) {
        weekNumber+=1
        weeks.push("Week - " + weekNumber);
        current.setDate(current.getDate() + 7); // Move to the next week
        }
    
        this.weeks = weeks;
        console.log('this.weeks@@', this.weeks);
    
        this.calculateColumnTotalsWeekly();
        this.calculateRowTotals(); 
        this.calculateTotal();
    }
    




    addRow() {
        const newRow = {
            id: this.tableData.length + 1,
            column1: '', // Role will be stored here
            column2: '', // Location will be stored here
            monthsData: this.months.map(month => ({ month, value: 0 })), // Monthly data placeholder
            isSelected: false,
            total: this.totalrow.toFixed(2)
        };

        this.tableData.push(newRow);
        this.calculateColumnTotals();
        this.calculateRowTotals(); 
        this.calculateTotal();
    }

    addRowWeekly() {
        const newRow = {
            id: this.tableData.length + 1,
            column1: '', // Role will be stored here
            column2: '', // Location will be stored here
            monthsData: this.weeks.map(month => ({ month, value: 0 })), // Monthly data placeholder
            isSelected: false,
           total: this.totalrow.toFixed(2)
        };

        this.tableData.push(newRow);
        this.calculateColumnTotalsWeekly();
        this.calculateRowTotals(); 
        this.calculateTotal();
    }


    deleteRow() {
        this.tableData = this.tableData.filter(row => !row.isSelected);
        this.isAllSelected = false;
        this.calculateColumnTotals();
        this.calculateRowTotals(); 
        this.calculateTotal();

    }

    deleteRowWeekly() {
        this.tableData = this.tableData.filter(row => !row.isSelected);
        this.isAllSelected = false;
        this.calculateColumnTotalsWeekly();
        this.calculateRowTotals();
        this.calculateTotal(); 

    }

    get formattedStartDate() {
        return this.startDate ? new Date(this.startDate).toLocaleDateString('en-GB') : '';
    }

    get formattedEndDate() {
        return this.endDate ? new Date(this.endDate).toLocaleDateString('en-GB') : '';
    }


    cancelAction() {

        if(this.version == 0){
            updateTalentFrequencyToZero({recordId: this.recordId})
            .then(() => {
                // Show toast message or perform any other action
                console.log('Frequency Updated');
            })
            .catch(error => {
                // Handle the error
                console.log(error);
            });
        }
     
        this.dispatchEvent(new CloseActionScreenEvent());

      
    
    }

    savePopUpOk(){
      this.showSavePopUp = false;  
      this.showDeletePopupTimeSheet  = false;
    }

    saveAction() {
        const hasMappedRecords = this.hasMappedTalentLoadings();
        console.log(hasMappedRecords);
      
        // Show toast message and prevent saving if any records are mapped
        if (hasMappedRecords) {
          this.showSavePopUp = true;
          return; // Stop further execution
        }
      
        if (this.talentHours > this.budgetHours) {
          const toastEvent = new ShowToastEvent({
            title: 'Error',
            message: 'Talent Hours cannot be greater than Budgeted Hours',
            variant: 'error',
          });
          this.dispatchEvent(toastEvent);
          return; // Return early if there is an error
        }
      
        const talentLoadings = [];
        const talentLoadingLines = [];
      
        for (let i = 0; i < this.tableData.length; i++) {
          const row = this.tableData[i];
          const role = row.column1;
          const location = row.column2;
      
          if (role && location) {
            // Create Talent Loading record
            const talentLoading = {};
            talentLoading.role = role;
            talentLoading.location = location;
            talentLoadings.push(talentLoading);
          }
      
          for (let j = 0; j < row.monthsData.length; j++) {
            const monthData = row.monthsData[j];
            const month = monthData.month;
            const hours = monthData.value;
      
            if (!role && hours > 0) {
              const toastEvent = new ShowToastEvent({
                title: 'Error',
                message: 'Role cannot be blank',
                variant: 'error',
              });
              this.dispatchEvent(toastEvent);
              return;
            }
      
            if (!location && hours > 0) {
              const toastEvent = new ShowToastEvent({
                title: 'Error',
                message: 'Location cannot be blank',
                variant: 'error',
              });
              this.dispatchEvent(toastEvent);
              return;
            }
      
            const talentLoadingLine = {};
            talentLoadingLine.months = month;
            talentLoadingLine.hours = hours;
            talentLoadingLine.indexes = i;
            talentLoadingLines.push(talentLoadingLine);
          }
        }
      
        this.isLoading = true;
      
        const talentLoadingRecords = JSON.stringify(talentLoadings);
        const talentLoadingLineRecords = JSON.stringify(talentLoadingLines);
      
        if (this.isNewRecord) {
          // Insert new records
          createTalentRecords({
            talentLoadingRecords: talentLoadingRecords,
            talentLoadingLineRecords: talentLoadingLineRecords,
            engId: this.recordId,
            start: this.startDate,
            endd: this.endDate,
            isNewRecord: true, // Pass isNewRecord flag
          })
            .then(result => {
              let resVersion = this.version + 1;
              console.log("Success");
              const toastEvent = new ShowToastEvent({
                title: 'Success',
                message: 'Talent Loading successfully saved. Version ' + resVersion,
                variant: 'success',
              });
              this.dispatchEvent(toastEvent);
              this[NavigationMixin.GenerateUrl]({
                type: 'standard__recordPage',
                attributes: {
                  recordId: this.recordId,
                  actionName: 'view',
                },
              })
                .then(url => {
                  window.location.href = url;
                })
                .catch(error => {
                  console.error(error);
                });
              this.isLoading = false;
              this.isNewRecord = false; // Update isNewRecord flag
            })
            .catch(error => {
              console.error('error>>>' + error.message);
              const toastEvent = new ShowToastEvent({
                title: 'Error',
                message: 'An error occurred while creating Talent Loading records',
                variant: 'error',
              });
              this.dispatchEvent(toastEvent);
              console.error(error);
              this.isLoading = false;
            });
        } else {
          // Update existing records
          createTalentRecords({
            talentLoadingRecords: talentLoadingRecords,
            talentLoadingLineRecords: talentLoadingLineRecords,
            engId: this.recordId,
            start: this.startDate,
            endd: this.endDate,
            isNewRecord: false, // Pass isNewRecord flag
          })
            .then(result => {
              let resVersion = this.version + 1;
              console.log("Success");
              const toastEvent = new ShowToastEvent({
                title: 'Success',
                message: 'Talent Loading successfully updated. Version ' + resVersion,
                variant: 'success',
              });
              this.dispatchEvent(toastEvent);
              this.isLoading = false;
            })
            .catch(error => {
              console.error('error>>>' + error.message);
              const toastEvent = new ShowToastEvent({
                title: 'Error',
                message: 'An error occurred while updating Talent Loading records',
                variant: 'error',
              });
              this.dispatchEvent(toastEvent);
              console.error(error);
              this.isLoading = false;
            });
        }
      }
      


    
}


import { Component, ViewContainerRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { IntegralUICommonService } from '@lidorsystems/integralui-web/bin/integralui/services/integralui.common.service';
import { IntegralUITreeGrid } from '@lidorsystems/integralui-web/bin/integralui/components/integralui.treegrid';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent  {
    // Get a reference to the TreeGrid component
    @ViewChild('treegrid') treegrid: IntegralUITreeGrid;

    // An Array object that holds all column objects shown in the TreeGrid
    public columns: Array<any>;
    // An Array object that holds all row objects shown in the TreeGrid
    public rows: Array<any>;

    // Edit variables
    private currentEditRow: any = null;
    public currentEditRowID: any = null;
    public currentEditCell: any = null;
    private isNewRow: boolean = false;

    public treegridStyle: any = {
        general: {
            normal: 'treegrid-ardyn-normal'
        }
    }

    constructor(private commonService?: IntegralUICommonService){
        this.columns = [
            { id: 2, headerText: "Firstname",headerAlignment: "center", contentAlignment: "center", width: 120},
            { id: 3, headerText: "Lastname", headerAlignment: "center", contentAlignment: "center", width: 120 },
            { id: 5, headerText: "company", headerAlignment: "center", contentAlignment: "center", width: 120 },
            { id: 7, headerText: "Edit/Delete", contentAlignment: "center", width: 100, fixedWidth: true }
        ];

        this.rows= [
                    { 
                        id: 11,
                        text: "krishnan",
                        cells: [ { cid: 2, text: "" }, { cid: 3, text: "" }, { cid: 5, text: "" }, { cid: 7 } ]
                    }

                ]

    } 

    // Prevent dblclick and mousedown events to bubble up from clicks on active buttons
    // This stops the expand.collapse of rows when doubleclicked
    onButtonsDblClick(e: any){
        e.stopPropagation();
    }

    onButtonsMouseDown(e: any){
        e.stopPropagation();
    }

    // Returns the level of the row in tree hierearchy
    getRowLevel(row: any){  
        let level: number = 0;

        let parent: any = this.treegrid.getRowParent(row);
        while (parent){
            level++;
            parent = this.treegrid.getRowParent(parent);
        }

        return level;
    }

    // Calculates the width of grid cell
    getCellWidth(cell: any){
        let cellWidth: number = 100;

        for (let j = 0; j < this.columns.length; j++){
            if (this.columns[j].id == cell.cid){
                cellWidth = this.columns[j].width; 
                break;
            }
        }

        let cellPadding: number = 4;

        if (cell.cid == 2){
            let row = this.treegrid.findRowById(cell.rid);
            let level: number = this.getRowLevel(row);

            cellPadding = 23 + level*15;
        }

        cellWidth -= cellPadding;

        return cellWidth;
    }

    // Selects the whole text in the text editor
    selectContent(e: any){
        if (e.target){
            setTimeout(function(){
                e.target.setSelectionRange(0, e.target.value.length);
            }, 1);
        }
    }

    // Creates a new row object
    createNewRow(){
        let row: any = {
            id: this.commonService.getUniqueId(),
            cells: [
                { cid: 2, text: "", saved: false },
                { cid: 3, text: "", saved: false },
                { cid: 5, text: "", saved: false },
                { cid: 7, saved: false }
            ]
        }

        for (let j = 0; j < row.cells.length; j++)
            row.cells[j].rid = row.id;

        this.isNewRow = true;

        return row;
    }

    // Adds a new row as root
    addRoot(){
        if (this.currentEditRow)
            this.cancelEdit(this.currentEditRow.id);

        this.insertRowInGrid();
    }

    // Adds a new row as child
    addChild(){
        if (this.currentEditRow)
            this.cancelEdit(this.currentEditRow.id);

        this.insertRowInGrid(this.treegrid.selectedRow);
    }

    // Inserts the created row at specific position and updates the grid layout
    insertRowInGrid(selRow?: any){
        let row: any = this.createNewRow();
    
        this.currentEditRow = row;
        this.currentEditRowID = row.id;
        this.currentEditCell = row.cells[0];

        this.treegrid.insertRowAt(row, 0, selRow);
        this.treegrid.updateLayout();
    }

    // Confirms the changes and saves the row
    saveRow(id: any){
        let row = this.treegrid.findRowById(id);
        if (row){
            this.updateEditStatus(row, true);

            for (let j = 0; j < row.cells.length; j++)
                row.cells[j].text = row.cells[j].editText;

            if (this.isNewRow)
                this.moveRowToEnd(row);
        }

        this.resetEditor();
        this.isNewRow = false;
    }

    // Cancels the edit process and closes the editor
    cancelEdit(id: any){
        if (this.isNewRow)
            this.removeRow(id);

        this.resetEditor();
        this.isNewRow = false;
    }

    // Sets the row in edit mode and opens the editor
    editRow(id: any){
        this.resetEditor();
        
        let row = this.treegrid.findRowById(id);
        if (row){
            this.updateEditStatus(row);

            this.currentEditRow = row;
            this.currentEditRowID = row.id;
            this.currentEditCell = row.cells[0];
        }
    } 

    // Cancels the edit process when ESCAPE key is pressed
    editorKeyDown(e: any){
        if (this.currentEditRow){
            switch (e.keyCode){
                case 27: // ESCAPE
                    this.cancelEdit(this.currentEditRow.id);
                    break;
            }
        }
    }

    // Removes a row from the grid
    removeRow(id: any){
        let row = this.treegrid.findRowById(id);
        if (row){
            this.treegrid.removeRow(row);
            this.treegrid.updateLayout();
        }
    }

    // Resets the variables for editing
    resetEditor(){
        this.updateEditStatus(this.currentEditRow, true);

        this.currentEditRow = null;
        this.currentEditRowID = null;
        this.currentEditCell = null;
    }

    // Updates the status of row, for edit or normal mode
    updateEditStatus(row: any, flag?: boolean){
        let status: boolean = flag ? true : false;

        if (row)
            for (let j = 0; j < row.cells.length; j++){
                row.cells[j].saved = status;

                // If row is in edit mode, copy the text value of grid cell to the cell editor
                if (!status)
                    row.cells[j].editText = row.cells[j].text;
            }
    }

    // Moves a row at end of the list
    moveRowToEnd(row: any){
        if (row){
            let list: Array<any> = this.rows;

            let parentRow = this.treegrid.getRowParent(row);
            if (parentRow)
                list = parentRow.rows;

            if (list){
                list.splice(list.length-1, 0, list.splice(0, 1)[0]);
                this.treegrid.updateLayout();
            }
        }
    }
}

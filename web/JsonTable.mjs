export class JsonTable {
    constructor(container, dataManager, opts = {}) {
        this.container = container;
        this.dataManager = dataManager;
        this.datasetKey = opts.dataset;  
        this.ignoreHover = opts.ignoreHover || false;
        this.title = opts.title;
        this.sqlDialog = opts.sqlDialog;

        // Create title element
        if (this.title) {
            this.titleElement = document.createElement("h2");
            this.titleElement.textContent = this.title;
            this.container.appendChild(this.titleElement);

            let btnViewSql = document.createElement("button");
            btnViewSql.textContent = "View SQL";
            btnViewSql.title = "View the SQL query used to generate this data";
            btnViewSql.style.marginLeft = "10px";
            btnViewSql.style.float = "right";
            btnViewSql.addEventListener("click", () => {
                const sql = dataManager.cmds[this.datasetKey];;
                this.sqlDialog.open(sql);
            });
            this.titleElement.appendChild(btnViewSql);
        }

        // Create table element
        this.tableContainer = document.createElement("div");
        this.container.appendChild(this.tableContainer);        

        this.dataManager.addEventListener(`${this.datasetKey}Changed`, e => {
            this.data = e.detail;
            this.renderTable();
        }); 

        this.dataManager.addEventListener('chart:hover', e => {
            if (this.ignoreHover) return;
            this.highlightRow(e.detail.dates);
        });  

        this.dataManager.addEventListener('chart:click', e => {
            this.dataManager.loadQuery(e.detail.dates);
        });  

        this.dataManager.addEventListener(`${this.datasetKey}Load`, async (e) => {
            this.data = await dataManager.loadQuery();
            this.renderTable();
        });         
             
    }

    renderTable() {
        // Clear tableContainer
        this.tableContainer.innerHTML = "";

        if (!this.data || this.data.length === 0) {
            const msg = document.createElement("div");
            msg.className = "no-data";
            msg.textContent = "No data available";
            this.tableContainer.appendChild(msg);

            return;
        }

        // Get column names from keys of the first object
        const columns = Object.keys(this.data[0]);

        this.table = document.createElement("table");
        
        // Create header row
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        columns.forEach(col => {
            const th = document.createElement("th");
            th.textContent = col;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        this.table.appendChild(thead);

        // Create body
        const tbody = document.createElement("tbody");
        this.data.forEach(rowData => {
            const row = document.createElement("tr");
            columns.forEach(col => {
                const td = document.createElement("td");
                td.textContent = rowData[col];
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
        this.table.appendChild(tbody);

        this.tableContainer.appendChild(this.table);        
    }

    // This method highlights the row corresponding to the given valid and tran dates
    highlightRow(dates) {

        this.table.querySelectorAll("tr.highlight").forEach(row => row.classList.remove("highlight"));
        if (!dates) return;

    const row = Array.from(this.table.rows)
        .find(r => {
            const cells = r.cells;
            // skip header row
            if (r.parentElement.tagName === 'THEAD') return false;
            
            const MAX_DATE = new Date(8640000000000000);
            const headers = Array.from(this.table.tHead.rows[0].cells);
            const validFromIdx = headers.findIndex(h => h.textContent.trim() === 'valid_from');
            const validToIdx = headers.findIndex(h => h.textContent.trim() === 'valid_to');
            const tranFromIdx = headers.findIndex(h => h.textContent.trim() === 'tran_from');
            const tranToIdx = headers.findIndex(h => h.textContent.trim() === 'tran_to');

            const validFromDate = new Date(cells[validFromIdx].textContent);
            const validToDate = (() => {
                const d = new Date(cells[validToIdx].textContent);
                return isNaN(d.getTime()) ? MAX_DATE : d;
                })();
            const tranFromDate = new Date(cells[tranFromIdx].textContent);
            const tranToDate  = (() => {
                const d = new Date(cells[tranToIdx].textContent);
                return isNaN(d.getTime()) ? MAX_DATE : d;
                })();           
            const validDate  = new Date(dates.validDate ); 
            const tranDate  = new Date(dates.tranDate ); 


            return validDate >= validFromDate && validDate < validToDate &&
                   tranDate  >= tranFromDate  && tranDate  < tranToDate;
        });     

        if (row) {
            row.classList.add("highlight");
            // Scroll row into view smoothly
            row.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }    
}

// DataManager.mjs 
export class DataManager extends EventTarget {

    #departmentData = [];
    #employeeData = [];
    #getData = [];

    constructor(config) {
        super();
        this.apiBaseUrl = config.apiBaseUrl || "";
        this.config = config;
    }

    async loadDepartments() {
        const data = await this.fetchData(`/Bitemporal/GetDepartmentBitemporalData?deptId=${this.config.deptId}`);
        this.#departmentData = data;
        this.dispatchEvent(new CustomEvent("DepartmentChanged", { detail: data }));
    }

    async loadEmployees() {
        const data = await this.fetchData(`/Bitemporal/GetEmployeeBitemporalData?deptId=${this.config.deptId}&empId=${this.config.empId}`);
        this.#employeeData = data;
        this.dispatchEvent(new CustomEvent("EmployeeChanged", { detail: data }));
    }    

    async loadQuery(dates) {
        const data = await this.fetchData(`/Bitemporal/GetData?validDate=${encodeURIComponent(dates.validDate)}&tranDate=${encodeURIComponent(dates.tranDate)}`);
        this.#getData = data;
        this.dispatchEvent(new CustomEvent("QueryChanged", { detail: data }));
    }    

    async loadData() {
        await Promise.all([this.loadDepartments(), this.loadEmployees()]);
    }

    async resetData() {
        try {
            const resetResponse = await this.fetchData("/Bitemporal/ResetData");
            console.log("Data reset response:", resetResponse);
            await this.loadData(); // Reload data after reset
        } catch (error) {
            console.error("Error loading data:", error);
        }
    }    

    async updateData(cmdName) {
        try {
            const resetResponse = await this.fetchData(`/Bitemporal/UpdateData/${cmdName}`);
            console.log("Data update response:", resetResponse);
            await this.loadData(); // Reload data after update
        } catch (error) {
            console.error("Error loading data:", error);
        }
    }   

    async fetchData(endpoint) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    getDepartments() {
        return [...this.#departmentData];
    }

    getEmployees() {
        return [...this.#employeeData];
    }

    async getCmds() {
        this.cmds = await this.fetchData("/Bitemporal/GetCmds");
        return this.cmds;
    }    
}


// BitemporalChart.mjs
export class BitemporalChart {
    constructor(canvas, dataManager, opts = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.dataManager = dataManager;
        this.datasetKey = opts.dataset;
        this.title = opts.title || "Bitemporal Chart";
        this.xAxisTitle = opts.xAxisTitle || "Valid Time";
        this.yAxisTitle = opts.yAxisTitle || "Transaction Time";
        this.data = [];
        this.hoveredId = null;
        this.baseFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize.trim()) || 14

        this.margin = opts.margin || { left: 80, top: 40, right: 20, bottom: 50 };
        this.colors = opts.colors || [ "#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"   ];
        this.dpr = window.devicePixelRatio || 1;

        // Initialize tooltip
        this.#initTooltip();

        // Mouse events
        this.canvas.addEventListener("mousemove", e => this.#onMouseMove(e));
        this.canvas.addEventListener("mouseleave", () => (this.tooltip.style.display = "none"));
        this.canvas.addEventListener("click", e => this.#onMouseClick(e));

        // Observe parent size changes
        this.resizeObserver = new ResizeObserver(() => this.#resizeCanvas());
        this.resizeObserver.observe(this.canvas.parentElement);        

        // Data change listener
        this.dataManager.addEventListener(`${this.datasetKey}Changed`, e => {
            this.data = e.detail;
            this.#resizeCanvas();
        });        
    }

    // ---------------- Public ----------------


    updateData(newData) {
        this.data = newData;
        this.#resizeCanvas();
    }

    // ---------------- Private ----------------
    #draw() {

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width * this.dpr, this.height * this.dpr);

        this.#computeBounds();        

        // Draw axes and rectangles
        this.#drawAxes();
        this.#drawRectangles();
        this.#drawTodayLines();
    }

    #initTooltip() {
        this.tooltip = document.createElement("div");
        Object.assign(this.tooltip.style, {
            position: "absolute",
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            pointerEvents: "none",
            display: "none",
            zIndex: 1000
        });
        document.body.appendChild(this.tooltip);
    }

    #resizeCanvas() {
        const style = getComputedStyle(this.canvas.parentElement);
        const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.width = rect.width - padX;
        this.height = rect.height - padY;

        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;

        this.canvas.style.width = this.width + "px";
        this.canvas.style.height = this.height + "px";

        this.chartWidth = this.width - this.margin.left - this.margin.right;
        this.chartHeight = this.height - this.margin.top - this.margin.bottom;

        if (this.data)
            this.#draw();
    }

    #computeBounds() {
        const validDates = [];
        const tranDates = [];
        this.data.forEach(d => {
            validDates.push(new Date(d.valid_from));
            if (d.valid_to) validDates.push(new Date(d.valid_to));
            tranDates.push(new Date(d.tran_from));
            if (d.tran_to) tranDates.push(new Date(d.tran_to));
        });

        this.validMin = this.#startOfYear(this.#minDate(validDates));
        this.validMax = this.#startOfNextYear(new Date()); // current date
        this.tranMin = this.#startOfYear(this.#minDate(tranDates));
        this.tranMax = this.#startOfNextYear(new Date()); // current date
    }

    #minDate(dates) { return new Date(Math.min(...dates.map(d => d.getTime()))); }
    #maxDate(dates) { return new Date(Math.max(...dates.map(d => d.getTime()))); }
    #startOfYear(date) { return new Date(date.getFullYear(), 0, 1); }
    #startOfNextYear(date) { return new Date(date.getFullYear() + 2, 0, 1); }

    #xScale(date) {
        return this.margin.left + ((date - this.validMin) / (this.validMax - this.validMin)) * this.chartWidth;
    }

    #yScale(date) {
        return this.margin.top + this.chartHeight - ((date - this.tranMin) / (this.tranMax - this.tranMin)) * this.chartHeight;
    }

    #yearTicks(min, max) {
        const ticks = [];
        for (let y = min.getFullYear(); y <= max.getFullYear(); y++) {
            ticks.push(new Date(y, 0, 1));
        }
        return ticks;
    }

    #drawAxes() {
        const ctx = this.ctx;
        ctx.save();
        ctx.scale(this.dpr, this.dpr);

        // Draw chart title
        ctx.fillStyle = "#000";
        ctx.font = `${this.baseFontSize*1.5}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(this.title, this.margin.left + this.chartWidth / 2, 5);

        // Draw axes lines
        ctx.strokeStyle = "#000";
        ctx.beginPath();
        ctx.moveTo(this.margin.left, this.margin.top);
        ctx.lineTo(this.margin.left, this.height - this.margin.bottom);
        ctx.lineTo(this.width - this.margin.right, this.height - this.margin.bottom);
        ctx.stroke();

        // Draw X axis ticks and labels
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.font = `${this.baseFontSize*1}px sans-serif`

        for (let t of this.#yearTicks(this.validMin, this.validMax)) {
            const x = this.#xScale(t);
            ctx.beginPath();
            ctx.moveTo(x, this.height - this.margin.bottom);
            ctx.lineTo(x, this.height - this.margin.bottom + 5);
            ctx.stroke();
            ctx.fillText(t.getFullYear(), x, this.height - this.margin.bottom + 8);
        }

        // Draw Y axis ticks and labels
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        for (let t of this.#yearTicks(this.tranMin, this.tranMax)) {
            const y = this.#yScale(t);
            ctx.beginPath();
            ctx.moveTo(this.margin.left - 5, y);
            ctx.lineTo(this.margin.left, y);
            ctx.stroke();
            ctx.fillText(t.getFullYear(), this.margin.left - 8, y);
        }

        // Draw axis titles if defined
        ctx.fillStyle = "#000";
        ctx.font = `${this.baseFontSize*1}px sans-serif`

        if (this.xAxisTitle) {
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(
                this.xAxisTitle,
                this.margin.left + (this.width - this.margin.left - this.margin.right) / 2,
                this.height - this.margin.bottom + 30
            );
        }

        if (this.yAxisTitle) {
            ctx.save();
            ctx.translate(this.margin.left - 60, this.margin.top + (this.height - this.margin.top - this.margin.bottom) / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(this.yAxisTitle, 0, 0);
            ctx.restore();
        }

        ctx.restore();
    }

    #drawRectangles() {
        const ctx = this.ctx;
        ctx.save();
        ctx.scale(this.dpr, this.dpr);

        this.data.forEach((d, i) => {
            const x1 = this.#xScale(new Date(d.valid_from));
            const x2 = this.#xScale(d.valid_to ? new Date(d.valid_to) : this.validMax);
            const y1 = this.#yScale(new Date(d.tran_from));
            const y2 = this.#yScale(d.tran_to ? new Date(d.tran_to) : this.tranMax);

            ctx.fillStyle = this.colors[i % this.colors.length];
            ctx.fillRect(x1, y2, x2 - x1, y1 - y2);
        });

        ctx.restore();
    }

    #drawTodayLines() {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = "red";
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "red";

        const today = new Date();

        // Horizontal Today line
        const todayY = this.#yScale(today);
        ctx.scale(this.dpr, this.dpr);  
        ctx.beginPath();
        ctx.moveTo(this.margin.left, todayY);
        ctx.lineTo(this.width - this.margin.right, todayY);
        ctx.stroke();

        // Vertical Today line
        const todayX = this.#xScale(today);
        ctx.beginPath();
        ctx.moveTo(todayX, this.margin.top);
        ctx.lineTo(todayX, this.height - this.margin.bottom);
        ctx.stroke();

        ctx.restore();
    }

    #onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const chartX = Math.min(Math.max(mouseX, this.margin.left), this.width - this.margin.right);
        const chartY = Math.min(Math.max(mouseY, this.margin.top), this.height - this.margin.bottom);

        const normX = (chartX - this.margin.left) / this.chartWidth;
        const normY = (this.chartHeight - (chartY - this.margin.top)) / this.chartHeight;

        const validDate = new Date(this.validMin.getTime() + normX * (this.validMax - this.validMin));
        const tranDate = new Date(this.tranMin.getTime() + normY * (this.tranMax - this.tranMin));

        this.#draw(); 

        // Return if outside chart area
        if (mouseX < this.margin.left || mouseX > this.width - this.margin.right ||
            mouseY < this.margin.top || mouseY > this.height - this.margin.bottom) {
            this.tooltip.style.display = "none";
            return;
        }

        // Draw crosshairs
        this.#drawCrosshairs(chartX, chartY, validDate, tranDate, e);
    }

    #drawCrosshairs(chartX, chartY, validDate, tranDate, e) {
        const ctx = this.ctx;
        ctx.save();
        ctx.scale(this.dpr, this.dpr);
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 1;

        // Vertical crosshair
        ctx.beginPath();
        ctx.moveTo(chartX, this.margin.top);
        ctx.lineTo(chartX, this.height - this.margin.bottom);
        ctx.stroke();

        // Horizontal crosshair
        ctx.beginPath();
        ctx.moveTo(this.margin.left, chartY);
        ctx.lineTo(this.width - this.margin.right, chartY);
        ctx.stroke();
        ctx.restore();

        // Update tooltip
        this.tooltip.innerHTML =
            `Tran Date: ${tranDate.toISOString().split("T")[0]}, ` +
            `Valid Date: ${validDate.toISOString().split("T")[0]}`;

        // Check for hover over rectangles
        let hovered = false; 
        let hoveredId;
        this.data.forEach((d, i) => {
            const x1 = this.#xScale(new Date(d.valid_from));
            const x2 = this.#xScale(d.valid_to ? new Date(d.valid_to) : this.validMax);
            const y1 = this.#yScale(new Date(d.tran_from));
            const y2 = this.#yScale(d.tran_to ? new Date(d.tran_to) : this.tranMax);
            if (chartX >= x1 && chartX <= x2 && chartY >= y2 && chartY <= y1) {
                this.tooltip.innerHTML += `<pre><strong>${JSON.stringify(d, null, 2)}</strong></pre>`;
                hovered = true;
                hoveredId = Object.values(d)[0]; 
            }   
        });

        this.#displayTooltip(e);

        // Change cursor style
        if (hovered) {
            this.canvas.style.cursor = "pointer";
        } else {
            this.canvas.style.cursor = "default";
        }

        // Alert bound listeners if needed
        if (this.hoveredId !== hoveredId) {
            this.hoveredId = hoveredId;
            const dates = {
                validDate: validDate.toISOString().split("T")[0],
                tranDate: tranDate.toISOString().split("T")[0]
            }            
            this.dataManager.dispatchEvent(new CustomEvent('chart:hover', { detail:{ dates}}) );
        }
    }

    #displayTooltip(e) {

        this.tooltip.style.display = "block";

        // position tooltip...
        // Get tooltip size
        const tooltipRect = this.tooltip.getBoundingClientRect();

        // Compute viewport width/height
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Default offset from mouse
        const offsetX = 10;
        const offsetY = 10;

        // Compute left position
        let left = e.pageX + offsetX;
        if (left + tooltipRect.width > vw) {
            left = vw - tooltipRect.width - 5; // 5px padding from edge
        }
        if (left < 0) left = 5;

        // Compute top position
        let top = e.pageY + offsetY;
        if (top + tooltipRect.height > vh) {
            top = vh - tooltipRect.height - 5; // 5px padding from edge
        }
        if (top < 0) top = 5;        

        // Apply positions
        this.tooltip.style.left = left + "px";
        this.tooltip.style.top = top + "px";
    }

    #onMouseClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Return if outside chart area
        if (mouseX < this.margin.left || mouseX > this.width - this.margin.right ||
            mouseY < this.margin.top || mouseY > this.height - this.margin.bottom) {
            return;
        }        

        const chartX = Math.min(Math.max(mouseX, this.margin.left), this.width - this.margin.right);
        const chartY = Math.min(Math.max(mouseY, this.margin.top), this.height - this.margin.bottom);

        const normX = (chartX - this.margin.left) / this.chartWidth;
        const normY = (this.chartHeight - (chartY - this.margin.top)) / this.chartHeight;

        const validDate = new Date(this.validMin.getTime() + normX * (this.validMax - this.validMin));
        const tranDate = new Date(this.tranMin.getTime() + normY * (this.tranMax - this.tranMin));

        const dates = {
            validDate: validDate.toISOString().split("T")[0],
            tranDate: tranDate.toISOString().split("T")[0]
        }
        this.dataManager.dispatchEvent(new CustomEvent('chart:click', { detail:{ dates}}) );        
    }    
}

/**
 * Whiteboard.js - AI-Powered Interactive Whiteboard
 * Supports drawing commands from AI and user interactions
 */

class Whiteboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Drawing state
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.penColor = '#000000';
        this.penSize = 2;
        this.tool = 'pen'; // pen, eraser

        // Setup event listeners
        this.setupEventListeners();
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.strokeStyle = this.tool === 'eraser' ? '#ffffff' : this.penColor;
        this.ctx.lineWidth = this.tool === 'eraser' ? 20 : this.penSize;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();

        this.lastX = x;
        this.lastY = y;
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    // AI Drawing Commands
    drawCommands(commands) {
        if (!Array.isArray(commands)) {
            console.error('Commands must be an array');
            return;
        }

        commands.forEach(cmd => {
            switch (cmd.type) {
                case 'line':
                    this.drawLine(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.color, cmd.width);
                    break;
                case 'circle':
                    this.drawCircle(cmd.x, cmd.y, cmd.radius, cmd.color, cmd.fill);
                    break;
                case 'rectangle':
                    this.drawRectangle(cmd.x, cmd.y, cmd.width, cmd.height, cmd.color, cmd.fill);
                    break;
                case 'text':
                    this.drawText(cmd.x, cmd.y, cmd.value, cmd.color, cmd.size);
                    break;
                case 'arrow':
                    this.drawArrow(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.color);
                    break;
                case 'clear':
                    this.clear();
                    break;
                default:
                    console.warn(`Unknown command type: ${cmd.type}`);
            }
        });
    }

    drawLine(x1, y1, x2, y2, color = '#000000', width = 2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }

    drawCircle(x, y, radius, color = '#000000', fill = false) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    drawRectangle(x, y, width, height, color = '#000000', fill = false) {
        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, width, height);
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, width, height);
        }
    }

    drawText(x, y, text, color = '#000000', size = 16) {
        this.ctx.font = `${size}px Arial`;
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }

    drawArrow(x1, y1, x2, y2, color = '#000000') {
        const headLength = 10;
        const angle = Math.atan2(y2 - y1, x2 - x1);

        // Draw line
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw arrow head
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(
            x2 - headLength * Math.cos(angle - Math.PI / 6),
            y2 - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(
            x2 - headLength * Math.cos(angle + Math.PI / 6),
            y2 - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setPenColor(color) {
        this.penColor = color;
        this.tool = 'pen';
    }

    setPenSize(size) {
        this.penSize = size;
    }

    setTool(tool) {
        this.tool = tool;
    }

    undo() {
        // Simple undo - would need history tracking for full implementation
        console.log('Undo not yet implemented');
    }

    getImageData() {
        return this.canvas.toDataURL('image/png');
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Whiteboard;
}

// Global instance
window.Whiteboard = Whiteboard;

// Wokwi Oscilloscope Chip - Versão Simplificada
const { pin, neopixel } = require('@wokwi/elements');

class OscilloscopeChip {
  constructor() {
    this.ch1Pin = pin('CH1', 'analog');
    this.ch2Pin = pin('CH2', 'analog'); 
    this.gndPin = pin('GND', 'ground');
    this.trigPin = pin('TRIG', 'digital');
    
    this.ch1Data = [];
    this.ch2Data = [];
    this.maxSamples = 200;
    this.running = true;
  }

  init() {
    console.log('Oscilloscope initializing...');
    
    // Criar display
    this.element = document.createElement('div');
    this.element.style.cssText = `
      width: 320px;
      height: 240px;
      background: #000;
      border: 2px solid #333;
      border-radius: 8px;
      position: relative;
      font-family: monospace;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      background: #2a2a2a;
      color: white;
      padding: 8px;
      font-size: 12px;
      font-weight: bold;
      border-bottom: 1px solid #444;
    `;
    header.textContent = '2-CH OSCILLOSCOPE';

    // Canvas para as formas de onda
    this.canvas = document.createElement('canvas');
    this.canvas.width = 320;
    this.canvas.height = 180;
    this.canvas.style.cssText = `
      display: block;
      background: #000;
    `;

    // Footer com informações
    const footer = document.createElement('div');
    footer.style.cssText = `
      background: #2a2a2a;
      color: white;
      padding: 6px 8px;
      font-size: 10px;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #444;
    `;
    footer.innerHTML = `
      <span style="color: #ff6b6b;">CH1: 1V/div</span>
      <span style="color: #4ecdc4;">CH2: 1V/div</span>
      <span>Time: 10ms/div</span>
    `;

    this.element.appendChild(header);
    this.element.appendChild(this.canvas);
    this.element.appendChild(footer);

    this.ctx = this.canvas.getContext('2d');
    
    // Inicializar
    this.drawGrid();
    this.startSampling();
    
    return this.element;
  }

  startSampling() {
    setInterval(() => {
      if (!this.running) return;

      // Simular leitura dos pinos (será substituído pela API real do Wokwi)
      const ch1Value = Math.sin(Date.now() * 0.01) * 2.5 + 2.5; // 0-5V
      const ch2Value = Math.cos(Date.now() * 0.015) * 2.5 + 2.5; // 0-5V

      this.ch1Data.push(ch1Value);
      this.ch2Data.push(ch2Value);

      if (this.ch1Data.length > this.maxSamples) {
        this.ch1Data.shift();
        this.ch2Data.shift();
      }

      this.draw();
    }, 50); // 20 FPS
  }

  drawGrid() {
    const { width, height } = this.canvas;
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    // Grid vertical
    for (let i = 0; i <= 10; i++) {
      const x = (i * width) / 10;
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
    }

    // Grid horizontal
    for (let i = 0; i <= 8; i++) {
      const y = (i * height) / 8;
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
    }
    this.ctx.stroke();

    // Linhas centrais
    this.ctx.strokeStyle = '#555';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, height / 2);
    this.ctx.lineTo(width, height / 2);
    this.ctx.moveTo(width / 2, 0);
    this.ctx.lineTo(width / 2, height);
    this.ctx.stroke();
  }

  draw() {
    this.drawGrid();

    const { width, height } = this.canvas;
    const centerY = height / 2;
    const scale = height / 10; // 5V = metade da altura

    // CH1 (vermelho)
    if (this.ch1Data.length > 1) {
      this.ctx.strokeStyle = '#ff6b6b';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();

      for (let i = 0; i < this.ch1Data.length; i++) {
        const x = (i / this.maxSamples) * width;
        const y = centerY - ((this.ch1Data[i] - 2.5) * scale);
        
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
    }

    // CH2 (ciano)
    if (this.ch2Data.length > 1) {
      this.ctx.strokeStyle = '#4ecdc4';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();

      for (let i = 0; i < this.ch2Data.length; i++) {
        const x = (i / this.maxSamples) * width;
        const y = centerY - ((this.ch2Data[i] - 2.5) * scale);
        
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
    }
  }
}

module.exports = OscilloscopeChip;

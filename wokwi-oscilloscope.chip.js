class OscilloscopeElement extends HTMLElement {
  constructor() {
    super();
    this.canvas = null;
    this.ctx = null;
    this.ch1Data = [];
    this.ch2Data = [];
    this.maxSamples = 300;
    this.timebase = 1; // ms per division
    this.voltageScale = 1; // V per division
    this.triggerLevel = 0;
    this.running = true;
    this.gridDivisions = { x: 10, y: 8 };
  }

  connectedCallback() {
    this.innerHTML = `
      <div style="display: flex; flex-direction: column; background: #1a1a1a; border: 2px solid #333; border-radius: 8px; font-family: monospace;">
        <div style="background: #2a2a2a; padding: 8px; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
          <div style="color: #fff; font-weight: bold; font-size: 14px;">2-CH OSCILLOSCOPE</div>
          <div style="display: flex; gap: 10px;">
            <button id="runStop" style="background: #4a4a4a; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">RUN</button>
            <button id="clear" style="background: #4a4a4a; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">CLEAR</button>
          </div>
        </div>
        
        <canvas id="scope" width="320" height="200" style="background: #000; border-bottom: 1px solid #444;"></canvas>
        
        <div style="padding: 8px; background: #2a2a2a; display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
          <div style="display: flex; gap: 15px;">
            <div style="color: #ff6b6b;">CH1: ${this.voltageScale}V/div</div>
            <div style="color: #4ecdc4;">CH2: ${this.voltageScale}V/div</div>
          </div>
          <div style="color: #fff;">Time: ${this.timebase}ms/div</div>
          <div style="color: #ffd93d;">Trig: ${this.triggerLevel}V</div>
        </div>
      </div>
    `;

    this.canvas = this.querySelector('#scope');
    this.ctx = this.canvas.getContext('2d');
    
    // Configurar eventos dos botões
    this.querySelector('#runStop').addEventListener('click', () => this.toggleRunStop());
    this.querySelector('#clear').addEventListener('click', () => this.clearDisplay());
    
    // Inicializar display
    this.drawGrid();
    this.startAnimation();
  }

  toggleRunStop() {
    this.running = !this.running;
    const btn = this.querySelector('#runStop');
    btn.textContent = this.running ? 'STOP' : 'RUN';
    btn.style.background = this.running ? '#e74c3c' : '#27ae60';
  }

  clearDisplay() {
    this.ch1Data = [];
    this.ch2Data = [];
    this.drawGrid();
  }

  drawGrid() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    
    // Grid principal
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    
    // Linhas verticais
    for (let i = 0; i <= this.gridDivisions.x; i++) {
      const x = (i * width) / this.gridDivisions.x;
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
    }
    
    // Linhas horizontais
    for (let i = 0; i <= this.gridDivisions.y; i++) {
      const y = (i * height) / this.gridDivisions.y;
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
    }
    this.ctx.stroke();
    
    // Linha central mais destacada
    this.ctx.strokeStyle = '#555';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, height / 2);
    this.ctx.lineTo(width, height / 2);
    this.ctx.moveTo(width / 2, 0);
    this.ctx.lineTo(width / 2, height);
    this.ctx.stroke();
  }

  addSample(ch1Value, ch2Value) {
    if (!this.running) return;
    
    this.ch1Data.push(ch1Value);
    this.ch2Data.push(ch2Value);
    
    // Manter apenas as últimas amostras
    if (this.ch1Data.length > this.maxSamples) {
      this.ch1Data.shift();
      this.ch2Data.shift();
    }
  }

  drawWaveforms() {
    const { width, height } = this.canvas;
    const centerY = height / 2;
    const pixelsPerSample = width / this.maxSamples;
    
    // Desenhar CH1 (vermelho)
    if (this.ch1Data.length > 1) {
      this.ctx.strokeStyle = '#ff6b6b';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      
      for (let i = 0; i < this.ch1Data.length; i++) {
        const x = i * pixelsPerSample;
        const y = centerY - (this.ch1Data[i] / this.voltageScale) * (height / this.gridDivisions.y);
        
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      this.ctx.stroke();
    }
    
    // Desenhar CH2 (ciano)
    if (this.ch2Data.length > 1) {
      this.ctx.strokeStyle = '#4ecdc4';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      
      for (let i = 0; i < this.ch2Data.length; i++) {
        const x = i * pixelsPerSample;
        const y = centerY - (this.ch2Data[i] / this.voltageScale) * (height / this.gridDivisions.y);
        
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      this.ctx.stroke();
    }
  }

  startAnimation() {
    const animate = () => {
      this.drawGrid();
      this.drawWaveforms();
      requestAnimationFrame(animate);
    };
    animate();
  }

  // Métodos para controle externo
  setTimebase(value) {
    this.timebase = value;
    this.updateControls();
  }

  setVoltageScale(value) {
    this.voltageScale = value;
    this.updateControls();
  }

  setTriggerLevel(value) {
    this.triggerLevel = value;
    this.updateControls();
  }

  updateControls() {
    const ch1Label = this.querySelector('div[style*="color: #ff6b6b"]');
    const ch2Label = this.querySelector('div[style*="color: #4ecdc4"]');
    const timeLabel = this.querySelector('div[style*="Time:"]');
    const trigLabel = this.querySelector('div[style*="Trig:"]');
    
    if (ch1Label) ch1Label.textContent = `CH1: ${this.voltageScale}V/div`;
    if (ch2Label) ch2Label.textContent = `CH2: ${this.voltageScale}V/div`;
    if (timeLabel) timeLabel.textContent = `Time: ${this.timebase}ms/div`;
    if (trigLabel) trigLabel.textContent = `Trig: ${this.triggerLevel}V`;
  }
}

// Registrar o elemento customizado
customElements.define('wokwi-oscilloscope', OscilloscopeElement);

// Classe principal do chip para o Wokwi
class OscilloscopeChip {
  constructor() {
    this.ch1Pin = null;
    this.ch2Pin = null;
    this.gndPin = null;
    this.trigPin = null;
    this.element = null;
    this.sampleInterval = 10; // ms
  }

  init() {
    // Criar elemento visual
    this.element = document.createElement('wokwi-oscilloscope');
    
    // Configurar pinos
    this.ch1Pin = this.addPin('CH1', 'analog-input');
    this.ch2Pin = this.addPin('CH2', 'analog-input');
    this.gndPin = this.addPin('GND', 'ground');
    this.trigPin = this.addPin('TRIG', 'digital-input');
    
    // Iniciar coleta de amostras
    setInterval(() => {
      const ch1Value = this.readAnalogPin(this.ch1Pin);
      const ch2Value = this.readAnalogPin(this.ch2Pin);
      
      // Converter para voltagem (assumindo 5V = 1023)
      const ch1Voltage = (ch1Value / 1023) * 5;
      const ch2Voltage = (ch2Value / 1023) * 5;
      
      this.element.addSample(ch1Voltage, ch2Voltage);
    }, this.sampleInterval);
    
    return this.element;
  }

  addPin(name, type) {
    // Simular API do Wokwi para adicionar pinos
    return { name, type };
  }

  readAnalogPin(pin) {
    // Simular leitura analógica (em implementação real seria fornecido pelo Wokwi)
    return Math.random() * 1023;
  }
}

// Exportar para o Wokwi
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OscilloscopeChip;
}
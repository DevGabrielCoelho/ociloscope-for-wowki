// Wokwi Custom Chip - Oscilloscope 2-Channel
// API Reference: https://docs.wokwi.com/chips-api/getting-started

const { CoordinateSystem } = require('@wokwi/elements');

class OscilloscopeChip {
  constructor() {
    this.ch1Pin = null;
    this.ch2Pin = null;
    this.gndPin = null;
    this.trigPin = null;
    this.ch1Data = [];
    this.ch2Data = [];
    this.maxSamples = 300;
    this.running = true;
    this.sampleCount = 0;
  }

  init() {
    // Configurar pinos conforme definido no .chip.json
    this.ch1Pin = this.addPin('CH1', 'analog');
    this.ch2Pin = this.addPin('CH2', 'analog');
    this.gndPin = this.addPin('GND', 'power');
    this.trigPin = this.addPin('TRIG', 'digital');

    // Criar display
    this.display = this.addDisplay({
      width: 320,
      height: 240,
      background: '#000000'
    });

    // Inicializar canvas
    this.canvas = this.display.getCanvas();
    this.ctx = this.canvas.getContext('2d');

    // Desenhar grid inicial
    this.drawGrid();

    // Configurar timer para amostragem
    this.timer = this.addTimer(10, this.sampleData.bind(this));
    this.animTimer = this.addTimer(16, this.animate.bind(this)); // ~60fps
  }

  sampleData() {
    if (!this.running) return;

    // Ler valores dos pinos
    const ch1Raw = this.ch1Pin.analogValue || 0;
    const ch2Raw = this.ch2Pin.analogValue || 0;

    // Converter para voltagem (0-5V)
    const ch1Voltage = (ch1Raw / 1023) * 5;
    const ch2Voltage = (ch2Raw / 1023) * 5;

    // Adicionar às arrays de dados
    this.ch1Data.push(ch1Voltage);
    this.ch2Data.push(ch2Voltage);

    // Manter apenas as últimas amostras
    if (this.ch1Data.length > this.maxSamples) {
      this.ch1Data.shift();
      this.ch2Data.shift();
    }

    this.sampleCount++;
  }

  animate() {
    this.drawGrid();
    this.drawWaveforms();
    this.drawControls();
  }

  drawGrid() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    // Grid principal
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    // Linhas verticais (10 divisões)
    for (let i = 0; i <= 10; i++) {
      const x = (i * width) / 10;
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height - 40); // Deixar espaço para controles
    }

    // Linhas horizontais (8 divisões na área do scope)
    const scopeHeight = height - 40;
    for (let i = 0; i <= 8; i++) {
      const y = (i * scopeHeight) / 8;
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
    }
    this.ctx.stroke();

    // Linhas centrais destacadas
    this.ctx.strokeStyle = '#555555';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    
    // Linha horizontal central
    const centerY = scopeHeight / 2;
    this.ctx.moveTo(0, centerY);
    this.ctx.lineTo(width, centerY);
    
    // Linha vertical central
    const centerX = width / 2;
    this.ctx.moveTo(centerX, 0);
    this.ctx.lineTo(centerX, scopeHeight);
    
    this.ctx.stroke();
  }

  drawWaveforms() {
    const { width } = this.canvas;
    const scopeHeight = 200; // Altura da área do scope
    const centerY = scopeHeight / 2;
    const pixelsPerSample = width / this.maxSamples;

    // Desenhar CH1 (vermelho)
    if (this.ch1Data.length > 1) {
      this.ctx.strokeStyle = '#ff6b6b';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();

      for (let i = 0; i < this.ch1Data.length; i++) {
        const x = i * pixelsPerSample;
        // Escala: 1V = 25 pixels (scopeHeight/8)
        const y = centerY - (this.ch1Data[i] * 25);

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
        const y = centerY - (this.ch2Data[i] * 25);

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      this.ctx.stroke();
    }
  }

  drawControls() {
    const { width, height } = this.canvas;
    const controlY = height - 40;

    // Fundo dos controles
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(0, controlY, width, 40);

    // Texto dos controles
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';

    // CH1 label
    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.fillText('CH1: 1V/div', 10, controlY + 15);

    // CH2 label
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.fillText('CH2: 1V/div', 10, controlY + 30);

    // Time base
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Time: 10ms/div', 120, controlY + 15);

    // Status
    this.ctx.fillStyle = this.running ? '#27ae60' : '#e74c3c';
    this.ctx.fillText(this.running ? 'RUN' : 'STOP', 120, controlY + 30);

    // Samples count
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Samples: ${this.sampleCount}`, width - 10, controlY + 22);
  }

  // Eventos do mouse para controles
  onMouseDown(x, y) {
    const { height } = this.canvas;
    const controlY = height - 40;
    
    if (y > controlY) {
      // Clique na área de controles - toggle run/stop
      this.running = !this.running;
      
      if (!this.running) {
        // Parar timer de amostragem
        this.timer.stop();
      } else {
        // Reiniciar timer
        this.timer.start();
      }
    }
  }

  // Limpar dados quando clicar com botão direito
  onMouseUp(x, y, button) {
    if (button === 2) { // Botão direito
      this.ch1Data = [];
      this.ch2Data = [];
      this.sampleCount = 0;
    }
  }
}

// Exportar a classe
module.exports = OscilloscopeChip;

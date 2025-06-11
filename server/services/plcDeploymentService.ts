import * as fs from 'fs/promises';
import * as path from 'path';

export interface PLCConfig {
  plcId: string;
  areaName: string;
  controlPath: string;
  scanRate: number;
  model: string;
  firmware: string;
}

export class PLCDeploymentService {
  private basePath: string;

  constructor(basePath: string = '.') {
    this.basePath = basePath;
  }

  async deployPLCToDirectory(config: PLCConfig): Promise<boolean> {
    try {
      const targetPath = path.join(this.basePath, config.controlPath);
      const plcDirPath = path.join(targetPath, '.plc');

      // Ensure target directory exists
      await fs.mkdir(targetPath, { recursive: true });
      
      // Create PLC control directory
      await fs.mkdir(plcDirPath, { recursive: true });

      // Deploy PLC configuration file
      const plcConfigFile = {
        plcId: config.plcId,
        areaName: config.areaName,
        controlPath: config.controlPath,
        scanRate: config.scanRate,
        model: config.model,
        firmware: config.firmware,
        deployedAt: new Date().toISOString(),
        status: "Running",
        tags: {
          system: {
            fileCount: 0,
            directorySize: 0,
            lastModified: new Date().toISOString(),
            processingLoad: 0,
            status: "Initializing"
          }
        }
      };

      await fs.writeFile(
        path.join(plcDirPath, 'plc-config.json'),
        JSON.stringify(plcConfigFile, null, 2)
      );

      // Create ladder logic file (industrial automation programming)
      const ladderLogic = this.generateLadderLogic(config);
      await fs.writeFile(
        path.join(plcDirPath, 'ladder-logic.txt'),
        ladderLogic
      );

      // Create I/O mapping file
      const ioMapping = this.generateIOMapping(config);
      await fs.writeFile(
        path.join(plcDirPath, 'io-mapping.json'),
        JSON.stringify(ioMapping, null, 2)
      );

      // Create watchdog file
      await fs.writeFile(
        path.join(plcDirPath, 'watchdog.log'),
        `PLC ${config.plcId} Watchdog Initialized - ${new Date().toISOString()}\n`
      );

      // Create scan cycle log
      await fs.writeFile(
        path.join(plcDirPath, 'scan-cycle.log'),
        `Scan Rate: ${config.scanRate}ms\nInitialized: ${new Date().toISOString()}\n`
      );

      // Deploy HMI interface
      await this.deployHMIInterface(config, targetPath);

      console.log(`PLC ${config.plcId} deployed to ${config.controlPath}`);
      return true;

    } catch (error) {
      console.error(`Failed to deploy PLC ${config.plcId}:`, error);
      return false;
    }
  }

  private async deployHMIInterface(config: PLCConfig, targetPath: string): Promise<void> {
    const hmiDirPath = path.join(targetPath, '.hmi');
    
    // Create HMI directory
    await fs.mkdir(hmiDirPath, { recursive: true });

    // Generate Perspective view JSON (Ignition-compatible)
    const perspectiveView = {
      meta: {
        name: `${config.areaName} Control View`,
        version: "8.1.25",
        lastModified: new Date().toISOString(),
        author: "Industrial Automation System"
      },
      custom: {},
      params: {},
      propConfig: {},
      root: {
        type: "ia.container.coord",
        version: 0,
        props: {
          style: {
            backgroundColor: "#1e1e1e",
            color: "#ffffff"
          }
        },
        children: [
          {
            type: "ia.display.label",
            version: 0,
            props: {
              text: `${config.areaName} - ${config.plcId}`,
              style: {
                fontSize: "24px",
                fontWeight: "bold",
                color: "#00ff00"
              }
            },
            position: {
              x: 20,
              y: 20,
              width: 300,
              height: 40
            }
          },
          {
            type: "ia.display.gauge",
            version: 0,
            props: {
              value: "{view.params.processingLoad}",
              max: 100,
              min: 0,
              style: {
                primaryColor: "#00ff00",
                backgroundColor: "#333333"
              }
            },
            position: {
              x: 20,
              y: 80,
              width: 200,
              height: 200
            }
          },
          {
            type: "ia.display.label",
            version: 0,
            props: {
              text: "Processing Load",
              style: {
                fontSize: "14px",
                color: "#cccccc"
              }
            },
            position: {
              x: 20,
              y: 290,
              width: 200,
              height: 20
            }
          },
          {
            type: "ia.display.table",
            version: 0,
            props: {
              data: "{view.params.systemTags}",
              columns: [
                {
                  field: "tag",
                  header: "Tag",
                  width: 200
                },
                {
                  field: "value",
                  header: "Value",
                  width: 150
                },
                {
                  field: "quality",
                  header: "Quality",
                  width: 100
                }
              ],
              style: {
                backgroundColor: "#2a2a2a",
                color: "#ffffff"
              }
            },
            position: {
              x: 250,
              y: 80,
              width: 450,
              height: 300
            }
          },
          {
            type: "ia.input.button",
            version: 0,
            props: {
              text: "Emergency Stop",
              style: {
                backgroundColor: "#ff0000",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "bold"
              }
            },
            position: {
              x: 20,
              y: 320,
              width: 120,
              height: 40
            }
          },
          {
            type: "ia.input.button",
            version: 0,
            props: {
              text: "Reset Alarms",
              style: {
                backgroundColor: "#ffaa00",
                color: "#000000",
                fontSize: "14px"
              }
            },
            position: {
              x: 150,
              y: 320,
              width: 120,
              height: 40
            }
          }
        ]
      }
    };

    await fs.writeFile(
      path.join(hmiDirPath, 'perspective-view.json'),
      JSON.stringify(perspectiveView, null, 2)
    );

    // Generate generic HMI index.html
    const hmiHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.areaName} HMI - ${config.plcId}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #1e1e1e;
            color: #ffffff;
            padding: 20px;
        }
        
        .hmi-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            background: linear-gradient(135deg, #2a2a2a, #404040);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #00ff00;
        }
        
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #00ff00;
            margin-bottom: 10px;
        }
        
        .subtitle {
            color: #cccccc;
            font-size: 14px;
        }
        
        .controls-grid {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .gauge-panel {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        
        .gauge {
            width: 200px;
            height: 200px;
            margin: 0 auto 20px;
            position: relative;
            border-radius: 50%;
            background: conic-gradient(#00ff00 0deg, #00ff00 var(--gauge-angle, 0deg), #333333 var(--gauge-angle, 0deg));
        }
        
        .gauge::before {
            content: '';
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            bottom: 10px;
            background: #2a2a2a;
            border-radius: 50%;
        }
        
        .gauge-value {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
            font-weight: bold;
            color: #00ff00;
            z-index: 1;
        }
        
        .tags-panel {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 8px;
        }
        
        .tags-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .tags-table th,
        .tags-table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #404040;
        }
        
        .tags-table th {
            background: #404040;
            color: #00ff00;
            font-weight: bold;
        }
        
        .status-good {
            color: #00ff00;
        }
        
        .status-warning {
            color: #ffaa00;
        }
        
        .status-bad {
            color: #ff0000;
        }
        
        .button-panel {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .hmi-button {
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .emergency-stop {
            background: #ff0000;
            color: #ffffff;
        }
        
        .emergency-stop:hover {
            background: #cc0000;
        }
        
        .reset-button {
            background: #ffaa00;
            color: #000000;
        }
        
        .reset-button:hover {
            background: #cc8800;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-online {
            background: #00ff00;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .last-update {
            text-align: center;
            color: #888888;
            font-size: 12px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="hmi-container">
        <div class="header">
            <div class="title">
                <span class="status-indicator status-online"></span>
                ${config.areaName} HMI - ${config.plcId}
            </div>
            <div class="subtitle">
                Model: ${config.model} | Firmware: ${config.firmware} | Scan Rate: ${config.scanRate}ms
            </div>
        </div>
        
        <div class="controls-grid">
            <div class="gauge-panel">
                <h3>Processing Load</h3>
                <div class="gauge" id="processingGauge">
                    <div class="gauge-value" id="gaugeValue">0%</div>
                </div>
                <div class="button-panel">
                    <button class="hmi-button emergency-stop" onclick="emergencyStop()">Emergency Stop</button>
                    <button class="hmi-button reset-button" onclick="resetAlarms()">Reset Alarms</button>
                </div>
            </div>
            
            <div class="tags-panel">
                <h3>System Tags</h3>
                <table class="tags-table">
                    <thead>
                        <tr>
                            <th>Tag</th>
                            <th>Value</th>
                            <th>Quality</th>
                        </tr>
                    </thead>
                    <tbody id="tagsTable">
                        <tr>
                            <td>File Count</td>
                            <td id="fileCount">0</td>
                            <td><span class="status-good">Good</span></td>
                        </tr>
                        <tr>
                            <td>Directory Size</td>
                            <td id="directorySize">0.0 MB</td>
                            <td><span class="status-good">Good</span></td>
                        </tr>
                        <tr>
                            <td>Processing Load</td>
                            <td id="processingLoad">0.0%</td>
                            <td><span class="status-good">Good</span></td>
                        </tr>
                        <tr>
                            <td>System Status</td>
                            <td id="systemStatus">Initializing</td>
                            <td><span class="status-good">Good</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="last-update">
            Last Update: <span id="lastUpdate">Loading...</span>
        </div>
    </div>

    <script>
        let perspectiveData = null;
        
        // Load Perspective JSON configuration
        async function loadPerspectiveView() {
            try {
                const response = await fetch('./perspective-view.json');
                perspectiveData = await response.json();
                console.log('Perspective view loaded:', perspectiveData);
            } catch (error) {
                console.error('Failed to load perspective view:', error);
            }
        }
        
        // Load PLC configuration and update display
        async function loadPLCData() {
            try {
                const response = await fetch('./plc-config.json');
                const plcData = await response.json();
                
                // Update gauge
                const processingLoad = parseFloat(plcData.tags.system.processingLoad);
                updateGauge(processingLoad);
                
                // Update table values
                document.getElementById('fileCount').textContent = plcData.tags.system.fileCount;
                document.getElementById('directorySize').textContent = plcData.tags.system.directorySize + ' MB';
                document.getElementById('processingLoad').textContent = plcData.tags.system.processingLoad + '%';
                document.getElementById('systemStatus').textContent = plcData.tags.system.status;
                document.getElementById('lastUpdate').textContent = new Date(plcData.lastUpdate || plcData.deployedAt).toLocaleString();
                
            } catch (error) {
                console.error('Failed to load PLC data:', error);
                document.getElementById('lastUpdate').textContent = 'Connection Error';
            }
        }
        
        function updateGauge(value) {
            const gauge = document.getElementById('processingGauge');
            const gaugeValue = document.getElementById('gaugeValue');
            
            const angle = (value / 100) * 360;
            gauge.style.setProperty('--gauge-angle', angle + 'deg');
            gaugeValue.textContent = value.toFixed(1) + '%';
            
            // Change color based on load
            let color = '#00ff00'; // Green
            if (value > 70) color = '#ffaa00'; // Orange
            if (value > 90) color = '#ff0000'; // Red
            
            gauge.style.background = \`conic-gradient(\${color} 0deg, \${color} \${angle}deg, #333333 \${angle}deg)\`;
            gaugeValue.style.color = color;
        }
        
        function emergencyStop() {
            alert('Emergency Stop Activated!\\nSystem shutdown initiated.');
            console.log('Emergency stop activated');
        }
        
        function resetAlarms() {
            alert('Alarms Reset\\nAll acknowledged alarms have been cleared.');
            console.log('Alarms reset');
        }
        
        // Initialize HMI
        loadPerspectiveView();
        loadPLCData();
        
        // Auto-refresh every 5 seconds
        setInterval(loadPLCData, 5000);
    </script>
</body>
</html>`;

    await fs.writeFile(
      path.join(hmiDirPath, 'index.html'),
      hmiHtml
    );
  }

  private generateLadderLogic(config: PLCConfig): string {
    return `// Ladder Logic for ${config.plcId} - ${config.areaName} Controller
// Generated: ${new Date().toISOString()}

// Input Rungs
|--[File_Count_Input]--[MOV]--[File_Count_Register]--|
|--[Directory_Size_Input]--[MOV]--[Size_Register]--|
|--[Last_Modified_Input]--[MOV]--[Modified_Register]--|

// Processing Logic
|--[File_Count_Register]--[MUL 0.5]--[ADD]--[Load_Calculator]--|
|--[Size_Register]--[DIV 1048576]--[MUL 0.1]--[ADD]--[Load_Calculator]--|
|--[Load_Calculator]--[LIM 5 95]--[MOV]--[Processing_Load_Output]--|

// Status Logic
|--[System_Heartbeat]--[TON T4:1 300000]--[MOV "Active"]--[Status_Output]--|
|--[T4:1/DN]--[MOV "Running"]--[Status_Output]--|

// Alarm Logic
|--[Processing_Load_Output]--[GRT 90]--[SET]--[High_Load_Alarm]--|
|--[File_Count_Register]--[GRT 1000]--[SET]--[High_File_Count_Alarm]--|

// Output Rungs
|--[Status_Output]--[MOV]--[UNS_Status_Tag]--|
|--[Processing_Load_Output]--[MOV]--[UNS_Load_Tag]--|
|--[File_Count_Register]--[MOV]--[UNS_FileCount_Tag]--|

// End of Program
`;
  }

  private generateIOMapping(config: PLCConfig): any {
    return {
      inputs: {
        "I:0/0": { tag: "File_Count_Input", description: "Directory file count" },
        "I:0/1": { tag: "Directory_Size_Input", description: "Directory total size" },
        "I:0/2": { tag: "Last_Modified_Input", description: "Last modification time" },
        "I:0/3": { tag: "System_Heartbeat", description: "System heartbeat signal" }
      },
      outputs: {
        "O:0/0": { tag: "Status_Output", description: "PLC operational status" },
        "O:0/1": { tag: "Processing_Load_Output", description: "Processing load percentage" },
        "O:0/2": { tag: "High_Load_Alarm", description: "High processing load alarm" },
        "O:0/3": { tag: "High_File_Count_Alarm", description: "High file count alarm" }
      },
      registers: {
        "N7:0": { tag: "File_Count_Register", description: "File count storage" },
        "N7:1": { tag: "Size_Register", description: "Directory size storage" },
        "N7:2": { tag: "Modified_Register", description: "Last modified timestamp" },
        "F8:0": { tag: "Load_Calculator", description: "Processing load calculation" }
      },
      timers: {
        "T4:1": { preset: 300000, description: "Activity timeout timer (5min)" }
      }
    };
  }

  async deployAllPLCs(): Promise<void> {
    const plcConfigs: PLCConfig[] = [
      { plcId: "PLC1", areaName: "Client", controlPath: "client", scanRate: 100, model: "CompactLogix 5370", firmware: "v32.011" },
      { plcId: "PLC2", areaName: "Server", controlPath: "server", scanRate: 100, model: "CompactLogix 5370", firmware: "v32.011" },
      { plcId: "PLC3", areaName: "Shared", controlPath: "shared", scanRate: 100, model: "CompactLogix 5370", firmware: "v32.011" },
      { plcId: "PLC4", areaName: "Components", controlPath: "client/src/components", scanRate: 100, model: "CompactLogix 5370", firmware: "v32.011" },
      { plcId: "PLC5", areaName: "Services", controlPath: "server/services", scanRate: 100, model: "CompactLogix 5370", firmware: "v32.011" },
      { plcId: "PLC6", areaName: "Types", controlPath: "client/src/types", scanRate: 100, model: "CompactLogix 5370", firmware: "v32.011" },
      { plcId: "PLC7", areaName: "Hooks", controlPath: "client/src/hooks", scanRate: 100, model: "CompactLogix 5370", firmware: "v32.011" },
      { plcId: "PLC8", areaName: "Pages", controlPath: "client/src/pages", scanRate: 100, model: "CompactLogix 5370", firmware: "v32.011" },
      { plcId: "PLC9", areaName: "Assets", controlPath: "attached_assets", scanRate: 100, model: "CompactLogix 5370", firmware: "v32.011" },
      { plcId: "PLC10", areaName: "Workspace", controlPath: "workspace", scanRate: 100, model: "CompactLogix 5370", firmware: "v32.011" }
    ];

    console.log('Deploying PLCs to repository directories...');
    
    for (const config of plcConfigs) {
      await this.deployPLCToDirectory(config);
    }

    console.log('All PLCs deployed successfully');
  }

  async updatePLCStatus(controlPath: string, status: any): Promise<void> {
    try {
      const plcConfigPath = path.join(this.basePath, controlPath, '.plc', 'plc-config.json');
      const configData = await fs.readFile(plcConfigPath, 'utf-8');
      const config = JSON.parse(configData);
      
      config.tags.system = { ...config.tags.system, ...status };
      config.lastUpdate = new Date().toISOString();
      
      await fs.writeFile(plcConfigPath, JSON.stringify(config, null, 2));
      
      // Update watchdog
      const watchdogPath = path.join(this.basePath, controlPath, '.plc', 'watchdog.log');
      await fs.appendFile(watchdogPath, `Status Update: ${new Date().toISOString()} - ${JSON.stringify(status)}\n`);
      
    } catch (error) {
      // PLC not deployed yet - this is normal during initialization
    }
  }
}
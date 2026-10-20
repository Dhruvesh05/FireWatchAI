<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:1F2937,100:F97316&height=190&section=header&text=FireWatch%20AI&fontSize=52&fontColor=ffffff&fontAlignY=38&desc=Real-Time%20Forest%20Fire%20%26%20Smoke%20Detection%20with%20YOLOv8&descSize=18&descAlignY=60&animation=fadeIn" />

<br>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&size=18&pause=1000&color=F97316&center=true&vCenter=true&width=640&lines=Detect+fire+before+it+spreads;YOLOv8+inference+on+images+%26+video;Audit+logging+with+SQLite;Instant+alerts+via+Telegram+Bot)](https://git.io/typing-svg)

<p>
<a href="https://fire-watch-ai-ten.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-F97316?style=for-the-badge&logo=vercel&logoColor=white" /></a>
<img src="https://img.shields.io/badge/License-Apache_2.0-1F2937?style=for-the-badge&logo=apache&logoColor=white" />
<img src="https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
<img src="https://img.shields.io/badge/YOLOv8-Ultralytics-111F68?style=for-the-badge&logo=yolo&logoColor=white" />
</p>

</div>

<br>

## Overview

**FireWatch AI** is an end-to-end computer vision platform that detects **fire** and **smoke** in images and videos using **YOLOv8**. Detections are logged to a database for auditing and analytics, and a **Telegram Bot** dispatches an alert to responders the moment fire confidence crosses a critical threshold.

The system is split into a lightweight **Flask inference API** and a modern **Next.js web interface**, making it easy to deploy, scale, and integrate.

| | |
|---|---|
| **Detection classes** | Fire, Smoke |
| **Input sources** | Image upload, video upload, live webcam feed |
| **Alert trigger** | Fire confidence > 0.75 |
| **Alert channel** | Telegram Bot API |
| **Logging** | SQLite audit trail with detection metrics and coordinates |

<br>

## Key Features

- **Multi-source detection:** analyze uploaded images, video files, or a live webcam stream
- **Real-time alerts:** instant Telegram notifications when fire is detected above the confidence threshold
- **Audit log:** every detection is recorded with metrics and bounding-box coordinates
- **Analytics dashboard:** live counters for total detections, fire events, smoke events, and alerts sent
- **Production-ready UI:** drag-and-drop upload, image/video analysis tabs, and light/dark mode
- **Deployable architecture:** frontend on Vercel, backend on Render (`render.yaml` included)

<br>

## Interface

<div align="center">

<img src="firewatch-landing/public/frontend.png" width="90%" alt="FireWatch AI web interface" />
<br>

<sub>FireWatch AI platform: upload, audit log, analytics, and Telegram alert views.</sub>

</div>

<br>

## Detection Output

<div align="center">

<img src="https://raw.githubusercontent.com/ThilakAmalkar/fire-results/main/fireOutputs/Screenshot%202025-05-24%20191803.png" width="75%" alt="Detection output" />

<br><br>

<img src="https://raw.githubusercontent.com/ThilakAmalkar/fire-results/main/fireOutputs/fire-op-2x.gif" width="700" alt="Detection on video" />

</div>

<br>

### Real-Time Detection and Alerting

<table>
<tr>
<td align="center" width="50%">
<img src="https://raw.githubusercontent.com/ThilakAmalkar/fire-results/main/fireOutputs/realTime.jpg" width="90%" alt="Live detection feed" />
<br><sub><b>Live Detection Feed</b></sub>
</td>
<td align="center" width="50%">
<img src="https://raw.githubusercontent.com/ThilakAmalkar/fire-results/main/fireOutputs/msg.jpg" width="75%" alt="Telegram alert" />
<br><sub><b>Telegram Alert Notification</b></sub>
</td>
</tr>
</table>

> [!NOTE]
> Alerts are triggered when fire is detected with confidence greater than **0.75** and are delivered instantly through the Telegram Bot API.

<br>

## System Architecture

```mermaid
flowchart LR
    A[Input Media<br/>Image / Video / Webcam] --> B[Next.js Frontend]
    B -->|REST API| C[Flask Backend]
    C --> D[YOLOv8 Inference<br/>OpenCV preprocessing]
    D --> E[(SQLite<br/>Audit Log)]
    D -->|confidence > 0.75| F[Telegram Bot Alert]
    E --> B
```

| Stage | Description |
|---|---|
| **1. Input** | User uploads an image or video, or connects a live feed |
| **2. Inference** | YOLOv8 processes frames (640×640 input) and detects Fire `[0]` and Smoke `[1]` |
| **3. Audit logging** | Detection metrics and coordinates are written to SQLite |
| **4. Notification** | Telegram bot dispatches an immediate alert to responders |

<br>

## Tech Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=python,flask,pytorch,opencv,nextjs,react,ts,sqlite,vercel,git,github&theme=dark" />

</div>

| Layer | Technology |
|---|---|
| **Model** | Ultralytics YOLOv8 (PyTorch) |
| **Computer Vision** | OpenCV |
| **Backend** | Python, Flask |
| **Frontend** | Next.js, React |
| **Database** | SQLite |
| **Alerts** | Telegram Bot API |
| **Deployment** | Vercel (frontend), Render (backend) |

<br>

## Model Evaluation

### Performance Summary

| Class | Images | Instances | Precision | Recall | mAP@0.5 | mAP@0.5:0.95 |
|---|---|---|---|---|---|---|
| **All** | 1722 | 2275 | 0.907 | 0.854 | 0.923 | 0.650 |
| **Fire** | 887 | 1002 | 0.943 | 0.914 | 0.963 | 0.732 |
| **Smoke** | 498 | 1273 | 0.871 | 0.794 | 0.883 | 0.567 |

### Metric Curves

<table>
<tr>
<td align="center" width="50%"><b>F1-Confidence</b><br><img src="https://raw.githubusercontent.com/ThilakAmalkar/fire-results/main/fireOutputs/F1_curve.png" /></td>
<td align="center" width="50%"><b>Precision-Recall</b><br><img src="https://raw.githubusercontent.com/ThilakAmalkar/fire-results/main/fireOutputs/PR_curve.png" /></td>
</tr>
<tr>
<td align="center" width="50%"><b>Precision-Confidence</b><br><img src="https://raw.githubusercontent.com/ThilakAmalkar/fire-results/main/fireOutputs/P_curve.png" /></td>
<td align="center" width="50%"><b>Recall-Confidence</b><br><img src="https://raw.githubusercontent.com/ThilakAmalkar/fire-results/main/fireOutputs/R_curve.png" /></td>
</tr>
</table>

### Confusion Matrix and Training Results

<div align="center">

<img src="https://raw.githubusercontent.com/ThilakAmalkar/fire-results/main/fireOutputs/confusion_matrix.png" width="45%" />
<img src="https://raw.githubusercontent.com/ThilakAmalkar/fire-results/main/fireOutputs/results.png" width="52%" />

</div>

<br>

## Project Structure

```text
FireWatchAI/
├── FireDetectionApp/      # Flask backend: YOLOv8 inference, logging, Telegram alerts
├── firewatch-landing/     # Next.js frontend and landing page
├── Trained-Models/        # Trained YOLOv8 weights
├── Training NoteBook/     # Model training notebook
├── Final results/         # Evaluation outputs and result artifacts
├── trainValBatch-Img/     # Training / validation batch samples
├── render.yaml            # Render deployment configuration
└── README.md
```

<br>

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+
- A Telegram bot token and chat ID (for alerts)

### 1. Clone the repository

```bash
git clone https://github.com/Dhruvesh05/FireWatchAI.git
cd FireWatchAI
```

### 2. Run the backend

```bash
cd FireDetectionApp

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows

# Install dependencies and start the API
pip install -r requirements.txt
python app.py
```

### 3. Configure Telegram alerts

Set the following environment variables before starting the backend:

```bash
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_CHAT_ID=<your-chat-id>
```

### 4. Run the frontend

```bash
cd firewatch-landing
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

<br>

## Roadmap

- [ ] Multi-camera and RTSP stream support
- [ ] GPS-tagged alerts with map visualization
- [ ] Email / SMS alert channels
- [ ] Model optimization for edge devices (ONNX / TensorRT)
- [ ] Docker Compose setup for one-command deployment

<br>

## Acknowledgements

- **Dataset:** [D-Fire Dataset](https://github.com/gaiasd/DFireDataset)
- **Reference:** [Stay Ahead of the Flames: Wildfire Detection with YOLOv8](https://medium.com/institute-of-smart-systems-and-ai/stay-ahead-of-the-flames-a-comprehensive-guide-to-wildfire-prevention-with-yolov8-3eb8edd1121a)
- **Model framework:** [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics)
- Based on the open-source [Forest-fire-detection](https://github.com/thilak-r/Forest-fire-detection) project (Apache 2.0).

<br>

## License

Distributed under the Apache License 2.0. See `LICENSE` for details.

<br>

<div align="center">

**Built by [Dhruvesh Patil](https://github.com/Dhruvesh05)**

<a href="https://www.linkedin.com/in/dhruvesh-patil-a31917280/"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" /></a>
<a href="mailto:dhruveshpatil7777@gmail.com"><img src="https://img.shields.io/badge/Email-F97316?style=for-the-badge&logo=gmail&logoColor=white" /></a>

<br><br>

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:1F2937,100:F97316&height=100&section=footer" />

</div>

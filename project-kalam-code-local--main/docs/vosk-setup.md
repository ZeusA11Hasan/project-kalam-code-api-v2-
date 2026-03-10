# Vosk WASM Model Setup

## 1. Download the Model

Download the lightweight English model from:
**https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip**

## 2. Extract and Place Files

After extracting, your `/public/vosk-model/` folder should have:

```
public/
└── vosk-model/
    ├── am/
    │   └── final.mdl
    ├── conf/
    │   ├── mfcc.conf
    │   └── model.conf
    ├── graph/
    │   ├── disambig_tid.int
    │   ├── HCLr.fst
    │   ├── Gr.fst
    │   └── phones/
    │       └── word_boundary.int
    ├── ivector/
    │   ├── final.dubm
    │   ├── final.ie
    │   ├── final.mat
    │   ├── global_cmvn.stats
    │   ├── online_cmvn.conf
    │   └── splice.conf
    └── README
```

## 3. Also Download Vosk WASM Files

Download from: https://github.com/nickaein/vosk-browser/releases

Place these in `/public/vosk/`:
```
public/
└── vosk/
    ├── vosk.js
    ├── vosk.wasm
    └── vosk-worker.js
```

## 4. Alternative: Use CDN

If you don't want to self-host, use:
```ts
const VOSK_CDN = "https://cdn.jsdelivr.net/npm/vosk-browser@0.0.8/dist/";
```

## 5. Model Size
- Small model: ~40MB (recommended for web)
- Large model: ~1.8GB (for servers only)

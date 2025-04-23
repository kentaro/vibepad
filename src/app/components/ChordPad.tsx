"use client";

import React, { useState, useRef, useEffect } from "react";
import * as Tone from "tone";
import { useSearchParams } from "next/navigation";

const keys = [
    "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"
];
const scales = ["major", "minor", "dorian", "mixolydian", "lydian"];

const chordMap: Record<string, Record<string, string[][]>> = {
    C: {
        major: [
            ["Cmaj7", "Dm7", "Em7", "Fmaj7"],
            ["G7", "Am7", "Bm7b5", "E7"],
            ["F#m7b5", "A7", "D7", "Gmaj7"],
            ["A7", "E7", "Bbmaj7", "F#7", "Gsus4", "Cadd9", "Cmaj9", "Am9"],
        ],
        minor: [
            ["Cm7", "Dm7b5", "Ebmaj7", "Fm7"],
            ["Gm7", "Abmaj7", "Bb7", "Eb7"],
            ["F7", "Ab7", "Dbmaj7", "G7"],
            ["A7", "E7", "Bbmaj7", "F#7", "Gsus4", "Cadd9", "Cm9", "Gm9"],
        ],
        dorian: [
            ["Cm7", "Dm7", "Ebmaj7", "F7"],
            ["Gm7", "Am7b5", "Bbmaj7", "D7"],
            ["F#m7b5", "A7", "D7", "Gm7"],
            ["A7", "E7", "Bbmaj7", "F#7", "Gsus4", "Cadd9", "Dm9", "G13"],
        ],
        mixolydian: [
            ["C7", "Dm7", "Em7b5", "Fmaj7"],
            ["Gm7", "Am7", "Bbmaj7", "D7"],
            ["F#m7b5", "A7", "D7", "G7"],
            ["A7", "E7", "Bbmaj7", "F#7", "Gsus4", "Cadd9", "C9", "G9"],
        ],
        lydian: [
            ["Cmaj7#11", "D7", "E7", "F#7"],
            ["G7", "A7", "Bm7b5", "E7"],
            ["F#m7b5", "A7", "D7", "Gmaj7"],
            ["A7", "E7", "Bbmaj7", "F#7", "Gsus4", "Cadd9", "Fmaj9", "Emaj7"],
        ],
    },
    // 他のキーは後で拡張
};

const chordNotes: Record<string, string[]> = {
    "Cmaj7": ["C4", "E4", "G4", "B4"],
    "Dm7": ["D4", "F4", "A4", "C5"],
    "Em7": ["E4", "G4", "B4", "D5"],
    "Fmaj7": ["F4", "A4", "C5", "E5"],
    "G7": ["G3", "B3", "D4", "F4"],
    "Am7": ["A3", "C4", "E4", "G4"],
    "Bm7b5": ["B3", "D4", "F4", "A4"],
    "C7": ["C3", "E3", "G3", "Bb3"],
    "Em7b5": ["E3", "G3", "Bb3", "D4"],
    "Am7b5": ["A3", "C4", "Eb4", "G4"],
    "E7": ["E3", "G#3", "B3", "D4"],
    "F#m7b5": ["F#3", "A3", "C4", "E4"],
    "A7": ["A3", "C#4", "E4", "G4"],
    "D7": ["D4", "F#4", "A4", "C5"],
    "Gmaj7": ["G3", "B3", "D4", "F#4"],
    "Cm7": ["C4", "Eb4", "G4", "Bb4"],
    "Dm7b5": ["D4", "F4", "Ab4", "C5"],
    "Ebmaj7": ["Eb4", "G4", "Bb4", "D5"],
    "Fm7": ["F4", "Ab4", "C5", "Eb5"],
    "Gm7": ["G3", "Bb3", "D4", "F4"],
    "Abmaj7": ["Ab3", "C4", "Eb4", "G4"],
    "Bb7": ["Bb3", "D4", "F4", "Ab4"],
    "Eb7": ["Eb4", "G4", "Bb4", "Db5"],
    "F7": ["F4", "A4", "C5", "Eb5"],
    "Ab7": ["Ab3", "C4", "Eb4", "Gb4"],
    "Dbmaj7": ["Db4", "F4", "Ab4", "C5"],
    "Bbmaj7": ["Bb3", "D4", "F4", "A4"],
    "F#7": ["F#3", "A#3", "C#4", "E4"],
    "Gsus4": ["G3", "C4", "D4", "G4"],
    "Cadd9": ["C4", "E4", "G4", "D5"],
    "Cmaj9": ["C4", "E4", "G4", "B4", "D5"],
    "Am9": ["A3", "C4", "E4", "G4", "B4"],
    "Cm9": ["C4", "Eb4", "G4", "Bb4", "D5"],
    "Gm9": ["G3", "Bb3", "D4", "F4", "A4"],
    "Dm9": ["D4", "F4", "A4", "C5", "E5"],
    "G13": ["G3", "B3", "D4", "F4", "E5"],
    "C9": ["C4", "E4", "G4", "Bb4", "D5"],
    "G9": ["G3", "B3", "D4", "F4", "A4"],
    "Fmaj9": ["F4", "A4", "C5", "E5", "G5"],
    "Emaj7": ["E3", "G#3", "B3", "D#4"],
    "Cmaj7#11": ["C4", "E4", "G4", "B4", "F#5"],
};

// ────────────────────────────────────────────────────
// 音名テーブル
//   • 12 半音を両方の表記で持つ（Enharmonic 対応）
//   • getSemitones などは indexOf 最初マッチで動くので，
//     配列の重複は問題にならない
// ────────────────────────────────────────────────────
const NOTES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const NOTES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

// ----------------------------------------------------
// "♭系のキーか？" 判定：キー名に小文字 b が含まれるか，
// もしくは伝統的に♭系扱いの F
// ----------------------------------------------------
function isFlatKey(key: string) {
    return key.includes("b") || key === "F";
}

function getSemitones(from: string, to: string): number {
    const idxFrom = NOTES_SHARP.indexOf(from) !== -1 ? NOTES_SHARP.indexOf(from) : NOTES_FLAT.indexOf(from);
    const idxTo = NOTES_SHARP.indexOf(to) !== -1 ? NOTES_SHARP.indexOf(to) : NOTES_FLAT.indexOf(to);
    if (idxFrom === -1 || idxTo === -1) return 0;
    return idxTo - idxFrom;
}

function transposeChordName(chord: string, semitones: number, preferFlat = false): string {
    // #1  Fix: フラット記号 (b) も扱う
    const match = chord.match(/^([A-G](?:#|b)?)(.*)$/);
    if (!match) return chord;
    const [_, base, rest] = match;
    const idx = NOTES_SHARP.indexOf(base) !== -1 ? NOTES_SHARP.indexOf(base) : NOTES_FLAT.indexOf(base);
    if (idx === -1) return chord;
    let newIdx = idx + semitones;
    while (newIdx < 0) newIdx += 12;
    while (newIdx >= 12) newIdx -= 12;
    const notesArr = preferFlat ? NOTES_FLAT : NOTES_SHARP;
    return notesArr[newIdx] + rest;
}

function transposeChordGrid(grid: string[][], semitones: number, preferFlat = false): string[][] {
    return grid.map(row => row.map(chord => transposeChordName(chord, semitones, preferFlat)));
}

function transposeChordNotesMap(baseMap: Record<string, string[]>, semitones: number, preferFlat = false): Record<string, string[]> {
    const newMap: Record<string, string[]> = {};
    for (const [chord, notes] of Object.entries(baseMap)) {
        const newChord = transposeChordName(chord, semitones, preferFlat);
        newMap[newChord] = notes.map(n => {
            // #1 Fix 同様にフラット記号対応
            const match = n.match(/^([A-G](?:#|b)?)(\d)$/);
            if (!match) return n;
            const [_, base, octaveStr] = match;
            const idx = NOTES_SHARP.indexOf(base) !== -1 ? NOTES_SHARP.indexOf(base) : NOTES_FLAT.indexOf(base);
            if (idx === -1) return n;
            let octave = parseInt(octaveStr, 10);
            let newIdx = idx + semitones;
            while (newIdx < 0) { newIdx += 12; octave--; }
            while (newIdx >= 12) { newIdx -= 12; octave++; }
            const notesArr = preferFlat ? NOTES_FLAT : NOTES_SHARP;
            return notesArr[newIdx] + octave;
        });
    }
    return newMap;
}

export default function ChordPad() {
    const [key, setKey] = useState("C");
    const [scale, setScale] = useState("major");
    const [tempo, setTempo] = useState(120);
    const [tempoInput, setTempoInput] = useState('120');
    const [recorded, setRecorded] = useState<string[]>([]);
    const [isLooping, setIsLooping] = useState(false);
    const loopIndex = useRef(0);
    const loopTimer = useRef<NodeJS.Timeout | null>(null);
    const semitones = getSemitones("C", key);
    const preferFlat = isFlatKey(key);
    const baseChords = chordMap["C"][scale];
    const chords = semitones === 0 ? baseChords : transposeChordGrid(baseChords, semitones, preferFlat);
    const notesMap = semitones === 0 ? chordNotes : transposeChordNotesMap(chordNotes, semitones, preferFlat);
    const [copyMsg, setCopyMsg] = useState("");
    const synthRef = useRef<Tone.PolySynth | null>(null);
    const searchParams = useSearchParams();

    // テンポ関連の追加設定
    const MIN_TEMPO = 60;
    const MAX_TEMPO = 240;
    const getLoopInterval = () => Math.round(60000 / tempo / 2); // テンポから間隔を計算（半拍）

    // テンポのドラッグ制御用の状態とハンドラ
    const [isDraggingTempo, setIsDraggingTempo] = useState(false);
    const startDragYRef = useRef(0);
    const startTempoRef = useRef(0);

    // コード進行の保存・読み込み
    const SAVE_KEY = "chordpad_saved";

    // ハイライト用state
    const [activeChord, setActiveChord] = useState<string | null>(null);
    const [loopActiveIndex, setLoopActiveIndex] = useState<number | null>(null);
    // アニメーション状態の追加
    const [animatingPad, setAnimatingPad] = useState<string | null>(null);
    const [animatingKnob, setAnimatingKnob] = useState<string | null>(null);
    // ローカルストレージの状態
    const [hasSaved, setHasSaved] = useState(false);

    // 定番進行パターン（グリッドindexで指定）
    const progressionPatternsMajor = [
        // I–V–vi–IV (ポップス定番進行)
        { name: "Pop Standard (I–V–vi–IV)", indices: [0, 4, 5, 3] },
        // vi-IV-I-V (センシティブフィメール進行、同じコードの別パターン)
        { name: "Sensitive Female (vi-IV-I-V)", indices: [5, 3, 0, 4] },
        // IV-I-V-vi (Umbrella進行、同じコードの別パターン)
        { name: "Umbrella (IV-I-V-vi)", indices: [3, 0, 4, 5] },
        // I-vi-IV-V ('50s進行、定番ドゥーワップ)
        { name: "'50s Progression (I-vi-IV-V)", indices: [0, 5, 3, 4] },
        // ii-V-I (ジャズ定番進行)
        { name: "Jazz Standard (ii-V-I)", indices: [1, 4, 0] },
        // I-IV-V (スリーコード定番、ブルース)
        { name: "Three Chord (I-IV-V)", indices: [0, 3, 4] },
        // I-IV-V-IV (シャッフルブルース)
        { name: "Shuffle Blues (I-IV-V-IV)", indices: [0, 3, 4, 3] },
        // I-V-vi-iii-IV-I-IV-V (カノン進行拡張)
        { name: "Extended Canon (I-V-vi-iii-IV-I-IV-V)", indices: [0, 4, 5, 2, 3, 0, 3, 4] },
        // I-V-vi-IV-I-V-IV-V (プログレッシブハウス拡張)
        { name: "Progressive House (I-V-vi-IV-I-V-IV-V)", indices: [0, 4, 5, 3, 0, 4, 3, 4] },
        // I-♭VII-IV (ミクソリディアン進行)
        { name: "Mixolydian (I-♭VII-IV)", indices: [0, 6, 3] },
        // I-V-♭VII-IV (ロック定番進行)
        { name: "Rock Standard (I-V-♭VII-IV)", indices: [0, 4, 6, 3] },
        // I-vi-ii-V (リズムチェンジ)
        { name: "Rhythm Changes (I-vi-ii-V)", indices: [0, 5, 1, 4] },
    ];

    const progressionPatternsMinor = [
        // vi-IV-I-V タイプをマイナー相当で (i-♭VI-♭III-♭VII)
        { name: "Sensitive Female Minor (i-♭VI-♭III-♭VII)", indices: [0, 5, 3, 6] },
        // アンダルシアン・カデンツ
        { name: "Andalusian Cadence (i-♭VII-♭VI-V)", indices: [0, 6, 5, 4] },
        // i-♭VII-♭VI-V (マイナーエピック進行) ※既存を活用
        { name: "Minor Epic (i-♭VII-♭VI-V)", indices: [0, 6, 5, 4] },
        // ii°-V-i (minor Turnaround)
        { name: "Minor ii°-V-i", indices: [1, 4, 0] },
        // i-iv-VII-III (ダークポップ)
        { name: "Dark Pop (i-iv-VII-III)", indices: [0, 3, 6, 2] },
    ];

    // 追加state
    const [showPatternModal, setShowPatternModal] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && synthRef.current === null) {
            // サウンドチェイン: PolySynth -> HPF -> Limiter -> Destination
            synthRef.current = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "triangle" }, // 倍音をさらに削減
                envelope: {
                    attack: 0.02,
                    decay: 0.1,
                    sustain: 0.2,
                    release: 0.3,
                },
            });

            const hpf = new Tone.Filter({ type: "highpass", frequency: 120 });
            const limiter = new Tone.Limiter(-6);
            synthRef.current.chain(hpf, limiter, Tone.Destination);

            // Poly数と音量を調整
            synthRef.current.maxPolyphony = 8;
            synthRef.current.volume.value = -8;

            // 破棄時にフィルタとリミッタも解放
            (synthRef.current as any)._extraNodes = [hpf, limiter];
        }
        return () => {
            // PolySynth と追加ノードのクリーンアップ
            if (synthRef.current) {
                (synthRef.current as any)._extraNodes?.forEach((n: any) => n.dispose?.());
                synthRef.current.dispose();
            }
        };
    }, []);

    // ローカルストレージのチェック
    useEffect(() => {
        if (typeof window !== "undefined") {
            setHasSaved(!!localStorage.getItem(SAVE_KEY));
        }
    }, [SAVE_KEY]);

    // 初期化: URLパラメータから状態復元
    useEffect(() => {
        const urlKey = searchParams.get("key");
        const urlScale = searchParams.get("scale");
        const urlSeq = searchParams.get("seq");
        const urlTempo = searchParams.get("tempo");
        if (urlKey && keys.includes(urlKey)) setKey(urlKey);
        if (urlScale && scales.includes(urlScale)) setScale(urlScale);
        if (urlSeq) setRecorded(urlSeq.split(","));
        if (urlTempo) {
            const parsedTempo = parseInt(urlTempo, 10);
            if (parsedTempo >= MIN_TEMPO && parsedTempo <= MAX_TEMPO) {
                setTempo(parsedTempo);
            }
        }
    }, []);

    // ループ状態が切れたらハイライトをリセット
    useEffect(() => {
        if (!isLooping) {
            setLoopActiveIndex(null);
        }
    }, [isLooping]);

    // キー変更時のアニメーション
    useEffect(() => {
        setAnimatingKnob('key');
        const timer = setTimeout(() => setAnimatingKnob(null), 500);
        return () => clearTimeout(timer);
    }, [key]);

    // スケール変更時のアニメーション
    useEffect(() => {
        setAnimatingKnob('scale');
        const timer = setTimeout(() => setAnimatingKnob(null), 500);
        return () => clearTimeout(timer);
    }, [scale]);

    // テンポ変更時のアニメーション
    useEffect(() => {
        setAnimatingKnob('tempo');
        const timer = setTimeout(() => setAnimatingKnob(null), 500);
        return () => clearTimeout(timer);
    }, [tempo]);

    // テンポドラッグ開始
    const handleTempoMouseDown = (e: React.MouseEvent) => {
        setIsDraggingTempo(true);
        startDragYRef.current = e.clientY;
        startTempoRef.current = tempo;
        document.addEventListener('mousemove', handleTempoMouseMove);
        document.addEventListener('mouseup', handleTempoMouseUp);
    };

    // テンポドラッグ中
    const handleTempoMouseMove = (e: MouseEvent) => {
        if (!isDraggingTempo) return;
        const deltaY = startDragYRef.current - e.clientY;
        // 上方向にドラッグするとテンポ上昇、下方向で下降
        const newTempo = Math.max(MIN_TEMPO, Math.min(MAX_TEMPO, startTempoRef.current + Math.round(deltaY / 2)));
        setTempo(newTempo);
    };

    // テンポ変更ハンドラ（直接入力用）
    const handleTempoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // 数字3桁までの正規表現にマッチするか、空文字を許可
        if (/^\d{0,3}$/.test(value)) {
            setTempoInput(value);
        }
    };

    const commitTempoInput = () => {
        if (tempoInput === '') return; // 空の場合無視
        const numValue = parseInt(tempoInput, 10);
        if (!isNaN(numValue) && numValue >= MIN_TEMPO && numValue <= MAX_TEMPO) {
            setTempo(numValue);
        } else {
            // 範囲外なら元に戻す
            setTempoInput(tempo.toString());
        }
    };

    // テンポドラッグ終了
    const handleTempoMouseUp = () => {
        setIsDraggingTempo(false);
        document.removeEventListener('mousemove', handleTempoMouseMove);
        document.removeEventListener('mouseup', handleTempoMouseUp);
    };

    // コンポーネント解除時にイベントリスナーをクリア
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleTempoMouseMove);
            document.removeEventListener('mouseup', handleTempoMouseUp);
        };
    }, []);

    // 直前のコードと被らないよう，毎回 releaseAll() してから発音するヘルパー
    const playChord = (chord: string) => {
        let notes = notesMap[chord];
        if (!notes || !synthRef.current) return;

        // #4 ルートの音域が極端に低/高い場合に 1oct シフト
        try {
            const rootMidi = Tone.Frequency(notes[0]).toMidi();
            let shift = 0;
            if (rootMidi < 55) {
                shift = 12; // +1oct
            } else if (rootMidi > 67) {
                shift = -12; // -1oct
            }
            if (shift !== 0) {
                notes = notes.map(n => Tone.Frequency(n).transpose(shift).toNote());
            }
        } catch { /* Tone.Frequency 失敗時はそのまま */ }

        // ループ間隔から適切な長さを算出（少し短めにして被りを防ぐ）
        const durationSec = Math.max(0.05, (getLoopInterval() / 1000) - 0.05);

        // 前の発音を止める
        synthRef.current.releaseAll();
        synthRef.current.triggerAttackRelease(notes, durationSec);
    };

    const handlePlay = (chord: string) => {
        playChord(chord);
        setRecorded(r => [...r, chord]);
        setActiveChord(chord);

        // パッドアニメーション
        setAnimatingPad(chord);
        setTimeout(() => setAnimatingPad(null), 300);
        setTimeout(() => setActiveChord(null), 300);
    };

    const startLoop = () => {
        if (recorded.length === 0) return;
        setIsLooping(true);
        loopIndex.current = 0;
        const interval = getLoopInterval();
        const HIGHLIGHT_DELAY_MS = 20;
        loopTimer.current = setInterval(() => {
            const currentIdx = loopIndex.current;
            const chord = recorded[currentIdx];
            playChord(chord);

            // 少し遅らせてハイライト
            setTimeout(() => setLoopActiveIndex(currentIdx), HIGHLIGHT_DELAY_MS);

            loopIndex.current = (currentIdx + 1) % recorded.length;
        }, interval);
    };

    // テンポ変更時にループタイマーを更新
    useEffect(() => {
        if (isLooping && loopTimer.current) {
            // 既存のタイマーをクリア
            clearInterval(loopTimer.current);
            // 新しいテンポでタイマー再開
            const interval = getLoopInterval();
            const HIGHLIGHT_DELAY_MS = 20;
            loopTimer.current = setInterval(() => {
                const currentIdx = loopIndex.current;
                const chord = recorded[currentIdx];
                playChord(chord);
                setTimeout(() => setLoopActiveIndex(currentIdx), HIGHLIGHT_DELAY_MS);
                loopIndex.current = (currentIdx + 1) % recorded.length;
            }, interval);
        }
    }, [tempo]);

    const stopLoop = () => {
        setIsLooping(false);
        if (loopTimer.current) clearInterval(loopTimer.current);
    };

    const clearRecorded = () => {
        setRecorded([]);
        stopLoop();
    };

    const handleCopy = () => {
        const text = `Key: ${key}  Scale: ${scale}\n${recorded.join(" → ")}`;
        navigator.clipboard.writeText(text).then(() => {
            setCopyMsg("Copied");
            setTimeout(() => setCopyMsg(""), 1200);
        });
    };

    // シェア用URL生成
    const getShareUrl = () => {
        const base = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
        const params = new URLSearchParams({
            key,
            scale,
            seq: recorded.join(","),
            tempo: tempo.toString()
        });
        return `${base}?${params.toString()}`;
    };

    const handleShare = () => {
        const url = getShareUrl();
        navigator.clipboard.writeText(url).then(() => {
            setCopyMsg("Share URL copied");
            setTimeout(() => setCopyMsg(""), 1200);
        });
    };

    const handleSave = () => {
        const data = { key, scale, recorded, tempo };
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        setCopyMsg("Saved");
        setHasSaved(true);
        setTimeout(() => setCopyMsg(""), 1200);
    };

    const handleLoad = () => {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return;
        try {
            const data = JSON.parse(raw);
            if (data.key && keys.includes(data.key)) setKey(data.key);
            if (data.scale && scales.includes(data.scale)) setScale(data.scale);
            if (Array.isArray(data.recorded)) setRecorded(data.recorded);
            if (data.tempo && data.tempo >= MIN_TEMPO && data.tempo <= MAX_TEMPO) {
                setTempo(data.tempo);
            }
            setCopyMsg("Loaded");
            setTimeout(() => setCopyMsg(""), 1200);
        } catch { }
    };

    // 自動生成 - 修正版
    const handleAutoProgression = (patternIndex?: number) => {
        if (!chords || chords.length === 0) return;

        const patterns = scale === "minor" ? progressionPatternsMinor : progressionPatternsMajor;

        if (patternIndex !== undefined) {
            const pattern = patterns[patternIndex];
            const row = chords[0];
            const prog = pattern.indices.map(idx => row[idx % row.length] || row[0]);
            setRecorded(prog);
            setCopyMsg(`Generated: ${pattern.name}`);
            setShowPatternModal(false);
        } else {
            const randomPatternIndex = Math.floor(Math.random() * patterns.length);
            const pattern = patterns[randomPatternIndex];
            const row = chords[0];
            const prog = pattern.indices.map(idx => row[idx % row.length] || row[0]);
            setRecorded(prog);
            setCopyMsg(`Generated: ${pattern.name}`);
        }

        setTimeout(() => setCopyMsg(""), 1200);
    };

    // LEDインジケーター
    const renderLed = (active: boolean, color = 'accent', pulse = false) => (
        <div
            className={`w-2 h-2 rounded-full transition-all duration-200 ${active ? `bg-${color}` : 'bg-text-secondary opacity-30'} ${pulse && active ? 'led-pulse' : ''}`}
            style={{
                boxShadow: active ? `0 0 8px var(--${color === 'accent' ? 'accent' : 'pad-highlight'})` : 'none'
            }}
        />
    );

    // 単一グリッドのためにコードを結合し、重複を排除
    const allChords = Array.from(new Set(chords.flat()));

    // 進行パターンモーダルのレンダリング
    const renderPatternModal = () => {
        if (!showPatternModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-panel-bg rounded-xl p-4 w-full max-w-md max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-accent">Chord Progressions</h3>
                        <button
                            onClick={() => setShowPatternModal(false)}
                            className="text-text-secondary hover:text-accent"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {(scale === "minor" ? progressionPatternsMinor : progressionPatternsMajor).map((pattern, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAutoProgression(idx)}
                                className="text-left p-3 bg-dark-bg hover:bg-button-dark rounded-lg transition-colors"
                            >
                                <span className="block text-sm font-medium">{pattern.name}</span>
                                <span className="block text-xs text-text-secondary mt-1">
                                    {pattern.indices.map(i => {
                                        const chord = chords[0][i % chords[0].length];
                                        return chord;
                                    }).join(' → ')}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // テンポコントロール修正
    const handleTempoClick = (e: React.MouseEvent) => {
        // クリックした位置でテンポを調整する場合はここで実装
    };

    // tempo と tempoInput の同期
    useEffect(() => {
        setTempoInput(tempo.toString());
    }, [tempo]);

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="bg-panel-bg rounded-2xl p-4 sm:p-6 shadow-lg border border-border-dark">
                {/* ヘッダー部分 */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6 md:mb-8">
                    <div className="bg-dark-bg px-4 py-3 rounded-lg flex items-center gap-3 w-full md:w-auto">
                        <div className="flex flex-col">
                            <h1 className="text-xl font-semibold text-accent">
                                VibePad
                            </h1>
                        </div>
                        <div className="ml-auto md:hidden">
                            {/* モバイル向けインジケーター */}
                            <div className="flex items-center gap-2">
                                {isLooping ? (
                                    <span className="flex items-center gap-1 text-xs">
                                        {renderLed(true, 'accent', true)}
                                        <span className="text-accent">PLAYING</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs">
                                        {renderLed(false)}
                                        <span className="text-text-secondary">STOPPED</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-dark-bg px-4 py-3 rounded-lg flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
                        {/* ノブ風UIで表示 */}
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-button-dark border border-border-dark mb-2 flex items-center justify-center shadow-inner relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <select
                                        value={key}
                                        onChange={e => setKey(e.target.value)}
                                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                    >
                                        {keys.map(k => (
                                            <option key={k} value={k}>{k}</option>
                                        ))}
                                    </select>
                                    <span className="text-sm font-bold text-accent">{key}</span>
                                </div>
                                {/* インジケーターライン */}
                                <div
                                    className={`absolute top-1/2 left-1/2 w-1 h-4 bg-accent rounded-full transform -translate-x-1/2 -translate-y-1/2 origin-bottom ${animatingKnob === 'key' ? 'knob-rotate' : ''}`}
                                    style={{
                                        transform: `translate(-50%, -50%) rotate(${keys.indexOf(key) * 20}deg)`
                                    }}
                                />
                            </div>
                            <span className="text-xs uppercase font-medium text-text-secondary">Key</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-button-dark border border-border-dark mb-2 flex items-center justify-center shadow-inner relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <select
                                        value={scale}
                                        onChange={e => setScale(e.target.value)}
                                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                    >
                                        {scales.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <span className="text-xs font-bold text-button-secondary">{scale}</span>
                                </div>
                                {/* インジケーターライン */}
                                <div
                                    className={`absolute top-1/2 left-1/2 w-1 h-4 bg-button-secondary rounded-full transform -translate-x-1/2 -translate-y-1/2 origin-bottom ${animatingKnob === 'scale' ? 'knob-rotate' : ''}`}
                                    style={{
                                        transform: `translate(-50%, -50%) rotate(${scales.indexOf(scale) * 45}deg)`
                                    }}
                                />
                            </div>
                            <span className="text-xs uppercase font-medium text-text-secondary">Scale</span>
                        </div>

                        {/* テンポコントロール */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-16 h-12 rounded-lg bg-button-dark border border-border-dark mb-2 flex items-center justify-center shadow-inner relative overflow-hidden`}
                            >
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={tempoInput}
                                    onChange={handleTempoInputChange}
                                    onBlur={commitTempoInput}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { commitTempoInput(); (e.target as HTMLInputElement).blur(); } }}
                                    className="w-full h-full px-2 text-center bg-transparent text-white font-bold focus:outline-none"
                                    aria-label="Tempo"
                                />
                            </div>
                            <span className="text-xs uppercase font-medium text-text-secondary">BPM</span>
                        </div>
                    </div>
                </div>

                {/* コントロールパネル */}
                <div className="flex flex-col gap-4 sm:gap-6 mb-6">
                    {/* 再生コントロール */}
                    <div className="bg-dark-bg rounded-xl p-3 sm:p-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <button
                                onClick={startLoop}
                                disabled={isLooping || recorded.length === 0}
                                className="px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 bg-button-secondary disabled:opacity-40 text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5.14v14l11-7-11-7z" />
                                </svg>
                                <span className="text-sm sm:text-base">PLAY</span>
                            </button>
                            <button
                                onClick={stopLoop}
                                disabled={!isLooping}
                                className="px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 bg-button-dark disabled:opacity-40 text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 6h12v12H6z" />
                                </svg>
                                <span className="text-sm sm:text-base">STOP</span>
                            </button>
                            <button
                                onClick={clearRecorded}
                                disabled={recorded.length === 0}
                                className="px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 bg-button-dark disabled:opacity-40 text-white"
                            >
                                <span className="text-sm sm:text-base">CLEAR</span>
                            </button>

                            <div className="ml-auto flex items-center gap-2 sm:gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={recorded.length === 0}
                                    className="px-3 sm:px-4 py-2 rounded-lg bg-button-dark disabled:opacity-40 text-white text-sm sm:text-base"
                                >
                                    SAVE
                                </button>
                                <button
                                    onClick={handleLoad}
                                    disabled={!hasSaved}
                                    className="px-3 sm:px-4 py-2 rounded-lg bg-button-dark disabled:opacity-40 text-white text-sm sm:text-base"
                                >
                                    LOAD
                                </button>
                                <button
                                    onClick={() => setShowPatternModal(true)}
                                    className="px-3 sm:px-4 py-2 rounded-lg bg-button-primary text-white text-sm sm:text-base"
                                >
                                    PATTERNS
                                </button>
                                <button
                                    onClick={() => handleAutoProgression()}
                                    className="px-3 sm:px-4 py-2 rounded-lg bg-button-primary text-white text-sm sm:text-base"
                                >
                                    AUTO
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 記録部分 */}
                    <div className="bg-dark-bg rounded-xl p-3 sm:p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 overflow-x-auto">
                                <span className="text-text-secondary text-xs font-medium uppercase whitespace-nowrap">Sequence</span>
                                <div className="px-3 py-1 bg-pad-inactive rounded text-sm overflow-x-auto scrollbar-hide whitespace-nowrap max-w-full">
                                    {recorded.length === 0 ? '...' : recorded.join(' → ')}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
                                {copyMsg && (
                                    <span className="text-accent text-xs">{copyMsg}</span>
                                )}
                                <button
                                    onClick={handleCopy}
                                    disabled={recorded.length === 0}
                                    className="px-3 py-1 rounded-lg text-xs bg-button-dark disabled:opacity-40 text-white"
                                >
                                    COPY
                                </button>
                                <button
                                    onClick={handleShare}
                                    disabled={recorded.length === 0}
                                    className="px-3 py-1 rounded-lg text-xs bg-button-dark disabled:opacity-40 text-white"
                                >
                                    SHARE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* コードパッド グリッド */}
                <div className="bg-dark-bg rounded-xl p-3 sm:p-4">
                    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
                        {allChords.map((chord, idx) => {
                            const isActive = isLooping
                                ? recorded[loopActiveIndex ?? -1] === chord
                                : activeChord === chord;
                            const isAnimating = animatingPad === chord;
                            return (
                                <button
                                    key={`${chord}-${idx}`}
                                    onClick={() => handlePlay(chord)}
                                    className={`pad w-full h-16 sm:h-20 ${isActive ? 'active' : ''} ${isAnimating ? 'pad-press-animation' : ''} flex items-center justify-center relative`}
                                    style={{ animationDelay: `${idx * 0.02}s` }}
                                >
                                    <span className="text-sm font-medium">{chord}</span>
                                    {/* Ableton Move風のLEDストリップ */}
                                    <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-1">
                                        <div
                                            className={`w-1 h-4 rounded-full ${isActive ? 'bg-accent' : 'bg-text-secondary opacity-20'} ${isActive && isLooping ? 'led-pulse' : ''}`}
                                            style={{
                                                boxShadow: isActive ? '0 0 8px var(--accent-glow)' : 'none'
                                            }}
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            {renderPatternModal()}
        </div>
    );
} 
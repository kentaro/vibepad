"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
    // Major scale diatonic 7th chords in C
    "Cmaj7": ["C4", "E4", "G4", "B4"],
    "Dm7": ["D4", "F4", "A4", "C5"],
    "Em7": ["E4", "G4", "B4", "D5"],
    "Fmaj7": ["F4", "A4", "C5", "E5"],
    "G7": ["G4", "B4", "D5", "F5"],
    "Am7": ["A4", "C5", "E5", "G5"],
    "Bm7b5": ["B4", "D5", "F5", "A5"],

    // Other common 7th chords
    "C7": ["C4", "E4", "G4", "Bb4"],
    "Em7b5": ["E4", "G4", "Bb4", "D5"],
    "Am7b5": ["A4", "C5", "Eb5", "G5"],
    "E7": ["E4", "G#4", "B4", "D5"],
    "F#m7b5": ["F#4", "A4", "C5", "E5"],
    "A7": ["A4", "C#5", "E5", "G5"],
    "D7": ["D4", "F#4", "A4", "C5"],
    "Gmaj7": ["G4", "B4", "D5", "F#5"],

    // Minor scale diatonic and related
    "Cm7": ["C4", "Eb4", "G4", "Bb4"],
    "Dm7b5": ["D4", "F4", "Ab4", "C5"],
    "Ebmaj7": ["Eb4", "G4", "Bb4", "D5"],
    "Fm7": ["F4", "Ab4", "C5", "Eb5"],
    "Gm7": ["G4", "Bb4", "D5", "F5"],
    "Abmaj7": ["Ab4", "C5", "Eb5", "G5"],
    "Bb7": ["Bb4", "D5", "F5", "Ab5"],
    "Eb7": ["Eb4", "G4", "Bb4", "Db5"],
    "F7": ["F4", "A4", "C5", "Eb5"],
    "Ab7": ["Ab4", "C5", "Eb5", "Gb5"],
    "Dbmaj7": ["Db4", "F4", "Ab4", "C5"],
    "Bbmaj7": ["Bb4", "D5", "F5", "A5"],
    "F#7": ["F#4", "A#4", "C#5", "E5"],

    // Suspended & extensions
    "Gsus4": ["G4", "C5", "D5", "G5"],
    "Cadd9": ["C4", "E4", "G4", "D5"],

    // 9ths & higher
    "Cmaj9": ["C4", "E4", "G4", "B4", "D5"],
    "Am9": ["A4", "C5", "E5", "G5", "B5"],
    "Cm9": ["C4", "Eb4", "G4", "Bb4", "D5"],
    "Gm9": ["G4", "Bb4", "D5", "F5", "A5"],
    "Dm9": ["D4", "F4", "A4", "C5", "E5"],
    "G13": ["G4", "B4", "D5", "F5", "E6"],
    "C9": ["C4", "E4", "G4", "Bb4", "D5"],
    "G9": ["G4", "B4", "D5", "F5", "A5"],
    "Fmaj9": ["F4", "A4", "C5", "E5", "G5"],
    "Emaj7": ["E4", "G#4", "B4", "D#5"],
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

// ────────────────────────────────────────────────────
// ヘルパー: コードのボイシングを一定範囲に収める
//   • ルートはそのまま（オクターブ4）
//   • 他の音を G3(55)〜E5(76) に収め，必要に応じて±1oct
// ────────────────────────────────────────────────────
function fitChordRange(notes: string[] | undefined): string[] {
    // 未定義または空の配列をチェック
    if (!notes || notes.length === 0) return [];

    // ----------------------------------------------
    // 改良版コードボイシング関数
    //  • ルート音はそのまま保持
    //  • B, A など後半のルート音はオクターブ 3 に下げる
    //  • 他の音は適切な音域に配置
    // ----------------------------------------------
    const MIN_NOTE = 48; // C3
    const MAX_NOTE = 84; // C6

    const midis: number[] = notes.map(n => Tone.Frequency(n).toMidi() as number);
    const rootMidi = midis[0];

    // ルート音がB4/A4 などの場合は1オクターブ下げる（G以降は全体に低くする）
    let rootAdjusted = rootMidi;
    if (rootMidi >= 68) { // Ab4以上は下げる
        rootAdjusted = rootMidi - 12;
        midis[0] = rootAdjusted;
    }

    // 他の音もそれに合わせて配置
    for (let i = 1; i < midis.length; i++) {
        let m = midis[i];

        // ルートより下の音は1オクターブ上げて均一な音域にする
        while (m < rootAdjusted) {
            m += 12;
        }

        // 高すぎる音は下げる
        while (m > MAX_NOTE) {
            m -= 12;
        }

        // 低すぎる音は上げる
        while (m < MIN_NOTE) {
            m += 12;
        }

        // 直前の音と重なりそうなら少し調整
        if (i > 1 && Math.abs(m - midis[i - 1]) < 2) {
            m += 12;
            if (m > MAX_NOTE) m -= 24; // 上げて高すぎたら2オクターブ下げる
        }

        midis[i] = m;
    }

    return midis.map(m => Tone.Frequency(m as any, "midi").toNote());
}

// 音色の種類定義
type InstrumentType = 'triangle' | 'sine' | 'square' | 'sawtooth' | 'fmsine' | 'amsine' | 'pulse';
const instrumentOptions = [
    { value: 'triangle', label: 'Triangle', icon: '△' },
    { value: 'sine', label: 'Sine', icon: '∿' },
    { value: 'square', label: 'Square', icon: '⎍' },
    { value: 'sawtooth', label: 'Sawtooth', icon: '⋀⋁' },
    { value: 'fmsine', label: 'FM', icon: 'FM' },
    { value: 'amsine', label: 'AM', icon: 'AM' },
    { value: 'pulse', label: 'Pulse', icon: 'PW' },
];

// 音色タイプ別の設定
const instrumentSettings = {
    triangle: { volume: -8, attack: 0.02, decay: 0.1, sustain: 0.2, release: 0.3 },
    sine: { volume: -10, attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.4 },
    square: { volume: -14, attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.3 },
    sawtooth: { volume: -16, attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.3 },
    fmsine: { volume: -12, attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.4 },
    amsine: { volume: -12, attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.4 },
    pulse: { volume: -14, attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.4 }
};

export default function ChordPad() {
    const [key, setKey] = useState("C");
    const [scale, setScale] = useState("major");
    const [tempo, setTempo] = useState(120);
    const [tempoInput, setTempoInput] = useState('120');
    const [recorded, setRecorded] = useState<string[]>([]);
    const [isLooping, setIsLooping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const loopIndex = useRef(0);
    const loopTimer = useRef<NodeJS.Timeout | null>(null);
    const semitones = getSemitones("C", key);
    const preferFlat = isFlatKey(key);
    const baseChords = chordMap["C"][scale];
    const chords = semitones === 0 ? baseChords : transposeChordGrid(baseChords, semitones, preferFlat);
    const notesMap = semitones === 0 ? chordNotes : transposeChordNotesMap(chordNotes, semitones, preferFlat);
    const [copyMsg, setCopyMsg] = useState("");
    const synthRef = useRef<Tone.PolySynth | null>(null);
    // @ts-expect-error nextjs experimental overload
    const searchParams = useSearchParams({ suspense: true });

    // キーボード操作用の状態
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
    const [lastPressedKey, setLastPressedKey] = useState<string | null>(null);

    // テンポ関連の追加設定
    const MIN_TEMPO = 1;
    const MAX_TEMPO = 360;
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

    // アルペジオモード関連
    const [isArpMode, setIsArpMode] = useState(false);
    const [arpType, setArpType] = useState<'up' | 'down' | 'updown' | 'random'>('up');
    const [arpSpeed, setArpSpeed] = useState<number>(16); // 16分音符
    const arpTimerRef = useRef<NodeJS.Timeout | null>(null);
    const arpIndexRef = useRef<number>(0);
    const currentNotesRef = useRef<string[]>([]);
    const [arpOneShot, setArpOneShot] = useState(true); // 1回だけ再生モード（デフォルト）

    // アルペジオ設定（タイプや速度）が変更された時に即時反映する
    useEffect(() => {
        // アルペジオモードかつタイマーが存在する場合のみ処理
        if (isArpMode && arpTimerRef.current && currentNotesRef.current.length > 0) {
            // 現在のノートを保存
            const currentNotes = [...currentNotesRef.current];

            // ログ出力（デバッグ用）
            console.log(`Arpeggio settings changed - Type: ${arpType}, Speed: ${arpSpeed}`);

            // 現在のアルペジオを停止
            stopArpeggio();

            // 同じノートで新しい設定のアルペジオを開始
            setTimeout(() => {
                playArpeggio(currentNotes);
            }, 10);
        }
    }, [arpType, arpSpeed]);

    // 自動演奏モード関連
    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const [autoPlayInterval, setAutoPlayInterval] = useState<number>(4); // 4小節ごとに切り替え
    const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoPlayCountRef = useRef<number>(0);

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
        // 12小節ブルース
        { name: "12-Bar Blues (I-I-I-I-IV-IV-I-I-V-IV-I-I)", indices: [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 0] },
        // カスケードフィフス I-IV-ii-V
        { name: "Cascade Fifths (I-IV-ii-V)", indices: [0, 3, 1, 4] },
        // 続・ポップスタンダード I-V-vi-iii-IV
        { name: "Pop Variant (I-V-vi-iii-IV)", indices: [0, 4, 5, 2, 3] },
        // サークルオブフィフス下降 I-IV-vii°-iii-vi-ii-V-I
        { name: "Circle of Fifths", indices: [0, 3, 2, 1, 5, 1, 4, 0] },
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
        // ジャズ・マイナー Turnaround i-VI-II°-V
        { name: "Jazz Minor Turnaround (i-VI-ii°-V)", indices: [0, 5, 1, 4] },
        // ドリアン・マイナー i-IV-VII
        { name: "Dorian Groove (i-IV-VII)", indices: [0, 3, 6] },
        // ハーモニックマイナー i-♭VI-V7
        { name: "Harmonic Minor Cadence (i-♭VI-V7)", indices: [0, 5, 4] },
    ];

    // 拡張コード進行パターン - 複数行にまたがるコード指定
    // [row, index]形式で指定する2次元配列
    const extendedProgressionPatterns = [
        {
            name: "Jazz Tension Builder",
            positions: [[0, 0], [1, 1], [2, 2], [3, 3]]
        },
        {
            name: "Dark to Light Transition",
            positions: [[0, 0], [1, 1], [0, 3], [3, 5]]
        },
        {
            name: "Floating Atmosphere",
            positions: [[3, 7], [1, 2], [2, 0], [0, 5]]
        },
        {
            name: "Dramatic Resolution",
            positions: [[2, 2], [1, 4], [3, 3], [0, 0]]
        },
        {
            name: "Emotional Journey",
            positions: [[0, 0], [3, 4], [1, 5], [2, 3], [0, 0]]
        },
        {
            name: "Extended Tensions",
            positions: [[3, 2], [3, 3], [2, 1], [1, 0]]
        },
        {
            name: "Dream Sequence",
            positions: [[1, 2], [3, 7], [2, 3], [0, 5]]
        },
        {
            name: "Surprising Turns",
            positions: [[0, 0], [3, 6], [1, 4], [2, 1]]
        }
    ];

    // 追加state
    const [showPatternModal, setShowPatternModal] = useState(false);

    // アイコンSVG定義（コンポーネント圧縮のため）
    const icons = {
        play: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z" /></svg>,
        stop: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z" /></svg>,
        clear: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>,
        save: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>,
        load: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>,
        arp: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 20h14"></path><path d="M5 4h14"></path><path d="M5 12h14"></path><circle cx="5" cy="4" r="1" fill="currentColor"></circle><circle cx="12" cy="12" r="1" fill="currentColor"></circle><circle cx="19" cy="20" r="1" fill="currentColor"></circle></svg>,
        patterns: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>,
        record: (isActive: boolean) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isActive ? "red" : "currentColor"}><circle cx="12" cy="12" r="6" /></svg>,
        sequence: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>,
        copy: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>,
        share: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>,
        keyboard: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="8" x2="6" y2="8"></line><line x1="10" y1="8" x2="10" y2="8"></line><line x1="14" y1="8" x2="14" y2="8"></line><line x1="18" y1="8" x2="18" y2="8"></line><line x1="6" y1="12" x2="6" y2="12"></line><line x1="10" y1="12" x2="10" y2="12"></line><line x1="14" y1="12" x2="14" y2="12"></line><line x1="18" y1="12" x2="18" y2="12"></line><line x1="6" y1="16" x2="18" y2="16"></line></svg>,
        autoPlay: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4"></path><path d="M3 11v-1a4 4 0 0 1 4-4h14"></path><path d="M7 22l-4-4 4-4"></path><path d="M21 13v1a4 4 0 0 1-4 4H3"></path></svg>,
    };

    // コンポーネント状態
    const [instrument, setInstrument] = useState<InstrumentType>('triangle');

    // コンポーネント初期化時のシンセサイザー作成
    useEffect(() => {
        if (typeof window !== "undefined" && synthRef.current === null) {
            try {
                // シンセサイザーの初期化
                initSynth();
            } catch (e) {
                console.error("Error initializing synth:", e);
            }
        }
        return () => {
            // この時点でアルペジオとループを停止
            if (arpTimerRef.current) {
                clearInterval(arpTimerRef.current);
                arpTimerRef.current = null;
            }
            if (loopTimer.current) {
                clearInterval(loopTimer.current);
                loopTimer.current = null;
            }
            // PolySynth と追加ノードのクリーンアップ
            cleanupSynth();
        };
    }, []);

    // シンセサイザー初期化関数
    const initSynth = () => {
        try {
            // まず既存のシンセがあれば破棄
            cleanupSynth();

            // 選択された音色に最適なエンベロープと音量設定を使用
            const settings = instrumentSettings[instrument] || instrumentSettings.triangle;

            // サウンドチェイン: PolySynth -> HPF -> Limiter -> Destination
            synthRef.current = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: instrument as any },
                envelope: {
                    attack: settings.attack,
                    decay: settings.decay,
                    sustain: settings.sustain,
                    release: settings.release,
                },
            });

            const hpf = new Tone.Filter({ type: "highpass", frequency: 120 });
            const limiter = new Tone.Limiter(-6);
            synthRef.current.chain(hpf, limiter, Tone.Destination);

            // Poly数と音量を調整（音色に応じた最適な音量値を使用）
            synthRef.current.maxPolyphony = 8;
            synthRef.current.volume.value = settings.volume;

            // 追加ノードを保存
            (synthRef.current as any)._extraNodes = [hpf, limiter];

            // 初期化後にオーディオコンテキストをスタート
            if (Tone.context.state !== "running") {
                Tone.context.resume().catch(e => console.error("Failed to resume audio context:", e));
            }
        } catch (e) {
            console.error("Error creating synth:", e);
            synthRef.current = null;
        }
    };

    // シンセサイザー破棄関数
    const cleanupSynth = () => {
        if (synthRef.current) {
            try {
                // まず音を止める
                synthRef.current.releaseAll();
                // 追加ノードを破棄
                (synthRef.current as any)._extraNodes?.forEach((n: any) => n.dispose?.());
                // シンセ自体を破棄
                synthRef.current.dispose();
            } catch (e) {
                console.error("Error disposing synth:", e);
            }
            synthRef.current = null;
        }
    };

    // 音色変更時の処理
    useEffect(() => {
        // 音色変更時には新しいシンセを初期化する（音色を完全に更新）
        initSynth();
    }, [instrument]);

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
        const urlInstrument = searchParams.get("instrument");
        const urlArpMode = searchParams.get("arpMode");
        const urlArpType = searchParams.get("arpType");
        const urlArpSpeed = searchParams.get("arpSpeed");
        const urlAutoPlay = searchParams.get("autoPlay");
        const urlAutoInterval = searchParams.get("autoInterval");

        if (urlKey && keys.includes(urlKey)) setKey(urlKey);
        if (urlScale && scales.includes(urlScale)) setScale(urlScale);
        if (urlSeq) setRecorded(urlSeq.split(","));
        if (urlTempo) {
            const parsedTempo = parseInt(urlTempo, 10);
            if (parsedTempo >= MIN_TEMPO && parsedTempo <= MAX_TEMPO) {
                setTempo(parsedTempo);
            }
        }
        if (urlInstrument && instrumentOptions.some(opt => opt.value === urlInstrument)) {
            setInstrument(urlInstrument as InstrumentType);
        }
        if (urlArpMode) {
            setIsArpMode(urlArpMode === "true");
        }
        if (urlArpType && ["up", "down", "updown", "random"].includes(urlArpType)) {
            setArpType(urlArpType as 'up' | 'down' | 'updown' | 'random');
        }
        if (urlArpSpeed) {
            const speed = parseInt(urlArpSpeed, 10);
            if ([8, 16, 32].includes(speed)) {
                setArpSpeed(speed);
            }
        }
        if (urlAutoPlay === "true") {
            setIsAutoPlay(true);
        }
        if (urlAutoInterval) {
            const interval = parseInt(urlAutoInterval, 10);
            if ([2, 4, 8, 16].includes(interval)) {
                setAutoPlayInterval(interval);
            }
        }
    }, []);

    // ループ状態が切れたらハイライトをリセット
    useEffect(() => {
        if (!isLooping) {
            setLoopActiveIndex(null);
            // ループ停止時にアルペジオも停止
            stopArpeggio();
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
        // コードに対応する音符配列がnotesMapに存在するかチェック
        if (!notesMap[chord]) {
            console.error(`Notes not found for chord: ${chord}`);
            return;
        }

        let notes = fitChordRange(notesMap[chord]);
        if (!notes?.length) return;

        // オーディオコンテキストの状態を確認
        if (Tone.context.state !== "running") {
            // まだ開始していない場合、明示的に開始して発音
            Tone.start()
                .then(() => {
                    ensureSynthAndPlay(notes);
                })
                .catch(e => {
                    console.error("Failed to start Tone.js:", e);
                    // エラー時でも再生を試みる
                    ensureSynthAndPlay(notes);
                });
        } else {
            // 既に開始している場合はそのまま発音
            ensureSynthAndPlay(notes);
        }
    };

    // シンセの存在を確認して再生する補助関数
    const ensureSynthAndPlay = (notes: string[]) => {
        // シンセがない場合は初期化
        if (!synthRef.current) {
            initSynth();
        }

        // シンセが初期化されていれば再生
        if (synthRef.current) {
            actuallyPlayChord(notes);
        } else {
            console.error("Failed to initialize synthesizer");
        }
    };

    // 実際に音を鳴らす処理
    const actuallyPlayChord = (notes: string[]) => {
        if (!synthRef.current) return;

        // ルートが G3 未満の特殊ケース（念のため）
        try {
            const rootMidi = Tone.Frequency(notes[0]).toMidi();
            if (rootMidi < 55) {
                notes = notes.map(n => Tone.Frequency(n).transpose(12).toNote());
            }
        } catch (e) {
            console.error("Error processing notes:", e);
        }

        // アルペジオモードの場合
        if (isArpMode) {
            playArpeggio(notes);
            return;
        }

        // ループ間隔から適切な長さを算出（少し短めにして被りを防ぐ）
        const durationSec = Math.max(0.05, (getLoopInterval() / 1000) - 0.05);

        // 前の発音を止めて新しい音を鳴らす
        try {
            synthRef.current.releaseAll();
            synthRef.current.triggerAttackRelease(notes, durationSec);
        } catch (e) {
            console.error("Error playing chord:", e);
            // エラー時にシンセを再初期化して再試行
            initSynth();
            if (synthRef.current) {
                try {
                    synthRef.current.triggerAttackRelease(notes, durationSec);
                } catch (e2) {
                    console.error("Failed retry playing chord:", e2);
                }
            }
        }
    };

    // アルペジオ発音ロジック
    const playArpeggio = (notes: string[]) => {
        if (!synthRef.current || !notes.length) return;

        // 既存のアルペジオタイマーをクリア
        if (arpTimerRef.current) {
            clearInterval(arpTimerRef.current);
            arpTimerRef.current = null;
        }

        // 音色リセット
        try {
            synthRef.current.releaseAll();
        } catch (err) {
            console.error("Arpeggio synth error:", err);
            return; // シンセエラー時は中断、playChord側の回復処理に任せる
        }

        // 現在のノート配列を保存
        currentNotesRef.current = notes;

        // アルペジオのノート順序を設定
        let noteOrder: number[] = [];
        switch (arpType) {
            case 'up':
                noteOrder = [...Array(notes.length).keys()]; // [0,1,2,3,...]
                break;
            case 'down':
                noteOrder = [...Array(notes.length).keys()].reverse(); // [...,3,2,1,0]
                break;
            case 'updown':
                if (notes.length <= 1) {
                    noteOrder = [0];
                } else {
                    const up = [...Array(notes.length).keys()];
                    const down = [...up].reverse().slice(1, -1); // 最初と最後を除く
                    noteOrder = [...up, ...down];
                }
                break;
            case 'random':
                noteOrder = [...Array(notes.length).keys()];
                // ランダムに並べ替え
                for (let i = noteOrder.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [noteOrder[i], noteOrder[j]] = [noteOrder[j], noteOrder[i]];
                }
                break;
        }

        // インデックスリセット
        arpIndexRef.current = 0;

        // アルペジオ速度設定（テンポに基づく）
        // arpSpeedの値: 8=8分音符, 16=16分音符, 32=32分音符
        const beatsPerMinute = tempo;
        const beatDurationMs = 60000 / beatsPerMinute; // 1拍の長さ(ms)

        // 現在の速度設定に基づく音符の長さを計算
        // 4分音符を1拍とすると:
        // - 8分音符は1拍の1/2の長さ
        // - 16分音符は1拍の1/4の長さ
        // - 32分音符は1拍の1/8の長さ
        const noteFraction = arpSpeed / 4; // 4分音符に対する比率
        const arpIntervalMs = beatDurationMs / noteFraction;

        console.log(`Arpeggio interval: ${arpIntervalMs}ms (Tempo: ${tempo}, Speed: 1/${arpSpeed})`);

        // 最初の音を即時発音
        const firstNoteIdx = noteOrder[0];
        const noteDuration = arpIntervalMs / 1000 * 0.8; // 間隔の80%の長さで発音
        try {
            synthRef.current.triggerAttackRelease(notes[firstNoteIdx], noteDuration);
        } catch (err) {
            console.error("Arpeggio trigger error:", err);
            return; // シンセエラー時は中断
        }

        // ワンショットモード（1サイクルのみ）の場合は音の数を記録
        let notesPlayed = 1; // 最初の音はすでに鳴らした

        // アルペジオタイマー開始
        arpTimerRef.current = setInterval(() => {
            if (!synthRef.current || !currentNotesRef.current.length) {
                stopArpeggio();
                return;
            }

            // 次のインデックスに進む
            arpIndexRef.current = (arpIndexRef.current + 1) % noteOrder.length;
            const noteIdx = noteOrder[arpIndexRef.current];

            // 音を発音
            try {
                const note = currentNotesRef.current[noteIdx];
                synthRef.current.triggerAttackRelease(note, noteDuration);

                // ワンショットモードでは1サイクルで停止
                if (arpOneShot) {
                    notesPlayed++;
                    // パターンが1サイクル完了したらタイマー停止
                    if (notesPlayed >= noteOrder.length) {
                        setTimeout(() => {
                            stopArpeggio();
                        }, noteDuration * 1000); // 最後の音が鳴り終わってから停止
                    }
                }
            } catch (err) {
                console.error("Arpeggio interval error:", err);
                stopArpeggio(); // エラー発生時はアルペジオ停止
            }

        }, arpIntervalMs);
    };

    // アルペジオ停止
    const stopArpeggio = () => {
        if (arpTimerRef.current) {
            clearInterval(arpTimerRef.current);
            arpTimerRef.current = null;
        }
        if (synthRef.current) {
            try {
                synthRef.current.releaseAll();
            } catch (err) {
                console.error("Stop arpeggio error:", err);
            }
        }
    };

    const handlePlay = (chord: string) => {
        playChord(chord);
        if (isRecording) {
            setRecorded(r => [...r, chord]);
        }
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

            // undefinedのコードをスキップ
            if (chord === undefined || chord === null) {
                console.warn(`Skipping undefined chord at index ${currentIdx}`);
                loopIndex.current = (currentIdx + 1) % recorded.length;
                return;
            }

            // コードがnotesMapに存在するか確認
            if (!notesMap[chord]) {
                console.warn(`Chord not found in notesMap: ${chord}, skipping`);
                loopIndex.current = (currentIdx + 1) % recorded.length;
                return;
            }

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

                // undefinedのコードをスキップ
                if (chord === undefined || chord === null) {
                    console.warn(`Skipping undefined chord at index ${currentIdx}`);
                    loopIndex.current = (currentIdx + 1) % recorded.length;
                    return;
                }

                // コードがnotesMapに存在するか確認
                if (!notesMap[chord]) {
                    console.warn(`Chord not found in notesMap: ${chord}, skipping`);
                    loopIndex.current = (currentIdx + 1) % recorded.length;
                    return;
                }

                playChord(chord);
                setTimeout(() => setLoopActiveIndex(currentIdx), HIGHLIGHT_DELAY_MS);
                loopIndex.current = (currentIdx + 1) % recorded.length;

                // 自動演奏モードの場合、一定間隔でパターンを切り替え
                if (isAutoPlay) {
                    autoPlayCountRef.current += 1;
                    // 設定した小節数 × 2拍 に達したらパターン切り替え
                    // (1小節=2拍と仮定、4/4拍子なら実際は4拍だが簡易実装)
                    if (autoPlayCountRef.current >= autoPlayInterval * 2) {
                        // 次のパターンをランダムに選択
                        generateRandomProgression();
                        autoPlayCountRef.current = 0;
                    }
                }
            }, interval);
        }
    }, [tempo, isAutoPlay, autoPlayInterval, recorded]);

    // 自動演奏モードの開始/停止
    useEffect(() => {
        if (isAutoPlay) {
            // 自動演奏開始
            autoPlayCountRef.current = 0;
            generateRandomProgression();
            if (!isLooping) {
                startLoop();
            }
        } else {
            // 自動演奏停止 (ループ自体は続行)
            autoPlayCountRef.current = 0;
        }

        return () => {
            if (autoPlayTimerRef.current) {
                clearTimeout(autoPlayTimerRef.current);
                autoPlayTimerRef.current = null;
            }
        };
    }, [isAutoPlay]);

    // ランダムなコード進行を生成
    const generateRandomProgression = () => {
        if (!chords || chords.length === 0) return;

        const patterns = scale === "minor" ? progressionPatternsMinor : progressionPatternsMajor;
        const randomPatternIndex = Math.floor(Math.random() * patterns.length);
        const pattern = patterns[randomPatternIndex];
        const row = chords[0];

        // インデックスが範囲外でないことを確認
        const validIndices = pattern.indices.filter(idx => idx < row.length);
        if (validIndices.length === 0) {
            console.error("No valid chord indices found for this pattern");
            return;
        }

        // 有効なコードのみを使用
        const prog = validIndices.map(idx => row[idx]);

        // undefinedやnullがないことを確認
        const validProg = prog.filter(chord => chord !== undefined && chord !== null);

        if (validProg.length === 0) {
            console.error("No valid chords generated");
            return;
        }

        setRecorded(validProg);
        setCopyMsg(`Playing: ${pattern.name}`);
        setTimeout(() => setCopyMsg(""), 1200);
    };

    const stopLoop = () => {
        setIsLooping(false);
        setIsAutoPlay(false); // 自動演奏も停止
        if (loopTimer.current) clearInterval(loopTimer.current);
        // ループ停止時にアルペジオも停止
        stopArpeggio();
    };

    const clearRecorded = () => {
        setRecorded([]);
        stopLoop();
    };

    const handleCopy = () => {
        const text = `Key: ${key}  Scale: ${scale}  Instrument: ${instrument}${isArpMode ? `  Arpeggio: ${arpType} (${arpSpeed})` : ''}\n${recorded.join(" → ")}`;
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
            tempo: tempo.toString(),
            instrument
        });

        // アルペジオ設定を追加（もし有効なら）
        if (isArpMode) {
            params.append("arpMode", "true");
            params.append("arpType", arpType);
            params.append("arpSpeed", arpSpeed.toString());
        }

        // 自動演奏設定を追加（もし有効なら）
        if (isAutoPlay) {
            params.append("autoPlay", "true");
            params.append("autoInterval", autoPlayInterval.toString());
        }

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
        const data = {
            key,
            scale,
            recorded,
            tempo,
            instrument,
            isArpMode,
            arpType,
            arpSpeed,
            arpOneShot,
            isAutoPlay,
            autoPlayInterval
        };
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
            if (data.instrument && instrumentOptions.some(opt => opt.value === data.instrument)) {
                setInstrument(data.instrument);
            }
            if (typeof data.isArpMode === 'boolean') {
                setIsArpMode(data.isArpMode);
            }
            if (data.arpType && ["up", "down", "updown", "random"].includes(data.arpType)) {
                setArpType(data.arpType);
            }
            if (data.arpSpeed && [8, 16, 32].includes(data.arpSpeed)) {
                setArpSpeed(data.arpSpeed);
            }
            if (typeof data.arpOneShot === 'boolean') {
                setArpOneShot(data.arpOneShot);
            }
            if (typeof data.isAutoPlay === 'boolean') {
                setIsAutoPlay(data.isAutoPlay);
            }
            if (data.autoPlayInterval && [2, 4, 8, 16].includes(data.autoPlayInterval)) {
                setAutoPlayInterval(data.autoPlayInterval);
            }
            setCopyMsg("Loaded");
            setTimeout(() => setCopyMsg(""), 1200);
        } catch { }
    };

    // 自動生成 - 改良版
    const handleAutoProgression = (patternIndex?: number) => {
        if (!chords || chords.length === 0) return;

        // 基本パターンを選択
        const patterns = scale === "minor" ? progressionPatternsMinor : progressionPatternsMajor;

        // 通常パターンか拡張パターンか決定
        // - 指定があれば、その番号のパターンを使用
        // - 指定がなければ、ランダムにいずれかのパターンを使用（25%の確率で拡張パターン）
        let progression: string[] = [];
        let patternName = "";

        if (patternIndex !== undefined) {
            // 拡張パターンのインデックスかチェック
            if (patternIndex >= 100) {
                // 拡張パターンのインデックス (100を引く)
                const extIndex = patternIndex - 100;
                if (extIndex < extendedProgressionPatterns.length) {
                    const pattern = extendedProgressionPatterns[extIndex];
                    progression = generateExtendedPattern(pattern);
                    patternName = pattern.name;
                }
            } else {
                // 通常のパターン
                if (patternIndex < patterns.length) {
                    const pattern = patterns[patternIndex];
                    progression = generateStandardPattern(pattern);
                    patternName = pattern.name;
                }
            }
        } else {
            // ランダム選択 (25%の確率で拡張パターン)
            const useExtended = Math.random() < 0.25;

            if (useExtended) {
                const randomExtIndex = Math.floor(Math.random() * extendedProgressionPatterns.length);
                const pattern = extendedProgressionPatterns[randomExtIndex];
                progression = generateExtendedPattern(pattern);
                patternName = pattern.name;
            } else {
                const randomPatternIndex = Math.floor(Math.random() * patterns.length);
                const pattern = patterns[randomPatternIndex];
                progression = generateStandardPattern(pattern);
                patternName = pattern.name;
            }
        }

        if (progression.length > 0) {
            setRecorded(progression);
            setCopyMsg(`Generated: ${patternName}`);
        } else {
            setCopyMsg("Could not generate progression");
        }

        setShowPatternModal(false);
        setTimeout(() => setCopyMsg(""), 1200);
    };

    // 標準パターン生成
    const generateStandardPattern = (pattern: { name: string, indices: number[] }) => {
        const row = chords[0];

        // インデックスが範囲外でないことを確認
        const validIndices = pattern.indices.filter(idx => idx < row.length);
        if (validIndices.length === 0) {
            console.error("No valid chord indices found for this pattern");
            return [];
        }

        // 有効なコードのみを使用
        const prog = validIndices.map(idx => row[idx]);

        // undefinedやnullがないことを確認
        return prog.filter(chord => chord !== undefined && chord !== null);
    };

    // 拡張パターン生成
    const generateExtendedPattern = (pattern: { name: string, positions: number[][] }) => {
        // 有効なポジションのみ使用
        const validPositions = pattern.positions.filter(pos => {
            const [rowIdx, colIdx] = pos;
            return (
                rowIdx >= 0 &&
                rowIdx < chords.length &&
                colIdx >= 0 &&
                chords[rowIdx] &&
                colIdx < chords[rowIdx].length
            );
        });

        if (validPositions.length === 0) {
            console.error("No valid positions found for this pattern");
            return [];
        }

        // 各ポジションからコードを取得
        const prog = validPositions.map(pos => {
            const [rowIdx, colIdx] = pos;
            return chords[rowIdx][colIdx];
        });

        // undefinedやnullがないことを確認
        return prog.filter(chord => chord !== undefined && chord !== null);
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

    // コードパッドに表示するキーのマッピングを作成
    const getKeyForChord = (chordIndex: number): string => {
        const rowIndex = Math.floor(chordIndex / 6);
        const colIndex = chordIndex % 6;

        // 左側3列
        if (colIndex < 3) {
            if (rowIndex < keyboardMappingLeft.length && colIndex < keyboardMappingLeft[rowIndex].length) {
                return keyboardMappingLeft[rowIndex][colIndex].toUpperCase();
            }
        }
        // 右側3列
        else {
            const rightColIndex = colIndex - 3;
            if (rowIndex < keyboardMappingRight.length && rightColIndex < keyboardMappingRight[rowIndex].length) {
                return keyboardMappingRight[rowIndex][rightColIndex].toUpperCase();
            }
        }
        return '';
    };

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
                    <div className="mb-4">
                        <div className="flex gap-2 mb-2">
                            <button
                                onClick={() => handleAutoProgression()}
                                className="bg-button-secondary text-white py-2 px-4 rounded-lg hover:bg-accent transition-colors"
                            >
                                Random Progression
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h4 className="text-md font-semibold mb-2 text-accent">Standard Patterns</h4>
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
                                        }).filter(Boolean).join(' → ')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-md font-semibold mb-2 text-accent">Extended Patterns</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {extendedProgressionPatterns.map((pattern, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAutoProgression(100 + idx)}
                                    className="text-left p-3 bg-dark-bg hover:bg-button-dark rounded-lg transition-colors"
                                >
                                    <span className="block text-sm font-medium">{pattern.name}</span>
                                    <span className="block text-xs text-text-secondary mt-1">
                                        {pattern.positions.map(pos => {
                                            if (chords[pos[0]] && chords[pos[0]][pos[1]]) {
                                                return chords[pos[0]][pos[1]];
                                            }
                                            return null;
                                        }).filter(Boolean).join(' → ')}
                                    </span>
                                </button>
                            ))}
                        </div>
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

    // アルペジオタイプの表示名
    const arpTypeLabels = {
        'up': '↑',
        'down': '↓',
        'updown': '↕',
        'random': '?'
    };

    // アルペジオスピード選択肢
    const arpSpeedOptions = [
        { value: 8, label: '8th' },
        { value: 16, label: '16th' },
        { value: 32, label: '32nd' }
    ];

    // 改良版：左右に分かれたキーボードマッピング
    // 左手用と右手用に別々のマッピングを用意
    const keyboardMappingLeft = [
        ['q', 'w', 'e'],
        ['a', 's', 'd'],
        ['z', 'x', 'c']
    ];

    const keyboardMappingRight = [
        ['u', 'i', 'o'],
        ['j', 'k', 'l'],
        ['m', ',', '.']
    ];

    // キーボード制御関数
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // 入力フィールドでの操作は無視（テンポ入力中など）
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }

        const key = e.key.toLowerCase();

        // スペースキーで再生/停止
        if (key === ' ') {
            e.preventDefault();
            if (isLooping) {
                stopLoop();
            } else {
                startLoop();
            }
            return;
        }

        // 記録開始/停止をRキーに割り当て
        if (key === 'r' && e.ctrlKey) {
            e.preventDefault();
            setIsRecording(!isRecording);
            return;
        }

        // Escキーでキーボードヘルプを閉じる
        if (key === 'escape') {
            setShowKeyboardHelp(false);
            return;
        }

        // コード選択キーを探す
        const allChords = Array.from(new Set(chords.flat()));
        let triggered = false;

        // 左側キーマッピング（最初の3列）
        keyboardMappingLeft.forEach((row, rowIndex) => {
            const keyIndex = row.indexOf(key);
            if (keyIndex !== -1) {
                const chordIndex = rowIndex * 6 + keyIndex;
                if (chordIndex < allChords.length) {
                    const chord = allChords[chordIndex];
                    handlePlay(chord);
                    setLastPressedKey(key);
                    setTimeout(() => {
                        if (key === lastPressedKey) {
                            setLastPressedKey(null);
                        }
                    }, 300);
                    triggered = true;
                }
            }
        });

        // 右側キーマッピング（後の3列）
        if (!triggered) {
            keyboardMappingRight.forEach((row, rowIndex) => {
                const keyIndex = row.indexOf(key);
                if (keyIndex !== -1) {
                    const chordIndex = rowIndex * 6 + keyIndex + 3; // +3 で右側の列に移動
                    if (chordIndex < allChords.length) {
                        const chord = allChords[chordIndex];
                        handlePlay(chord);
                        setLastPressedKey(key);
                        setTimeout(() => {
                            if (key === lastPressedKey) {
                                setLastPressedKey(null);
                            }
                        }, 300);
                    }
                }
            });
        }

    }, [chords, isLooping, isRecording, lastPressedKey, startLoop, stopLoop, handlePlay]);

    // キーボードイベントリスナー設定
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // キーボードヘルプのレンダリング
    const renderKeyboardHelp = () => {
        if (!showKeyboardHelp) return null;

        // コード選択キーを探す
        const allChords = Array.from(new Set(chords.flat()));

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-panel-bg rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-accent">Keyboard Controls</h3>
                        <button
                            onClick={() => setShowKeyboardHelp(false)}
                            className="text-text-secondary hover:text-accent"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <div className="mb-6">
                        <h4 className="text-md font-medium mb-3 text-white">Chord Pad Keyboard Mapping</h4>

                        <div className="flex gap-2 mb-4">
                            <div className="flex-1">
                                <div className="grid grid-cols-3 gap-2">
                                    {/* 左側キーボード */}
                                    {keyboardMappingLeft.map((row, rowIndex) => (
                                        row.map((key, colIndex) => {
                                            const chordIndex = rowIndex * 6 + colIndex;
                                            return (
                                                <div
                                                    key={`left-${rowIndex}-${colIndex}`}
                                                    className="h-16 sm:h-20 bg-dark-bg rounded-xl flex flex-col items-center justify-center"
                                                >
                                                    <div className="text-xl font-bold uppercase text-white mb-1">{key}</div>
                                                    {chordIndex < allChords.length && (
                                                        <div className="text-sm text-accent">{allChords[chordIndex]}</div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="grid grid-cols-3 gap-2">
                                    {/* 右側キーボード */}
                                    {keyboardMappingRight.map((row, rowIndex) => (
                                        row.map((key, colIndex) => {
                                            const chordIndex = rowIndex * 6 + colIndex + 3;
                                            return (
                                                <div
                                                    key={`right-${rowIndex}-${colIndex}`}
                                                    className="h-16 sm:h-20 bg-dark-bg rounded-xl flex flex-col items-center justify-center"
                                                >
                                                    <div className="text-xl font-bold uppercase text-white mb-1">{key}</div>
                                                    {chordIndex < allChords.length && (
                                                        <div className="text-sm text-accent">{allChords[chordIndex]}</div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ))}
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-text-secondary mt-2">
                            Play chords with keyboard keys matching the 3x6 chord pad layout, split between left and right hands.
                        </p>
                    </div>

                    <div className="mb-4">
                        <h4 className="text-md font-medium mb-2 text-white">Additional Shortcuts</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <div className="px-3 py-1 bg-button-dark rounded">Space</div>
                                <span className="text-text-secondary">Play/Stop</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="px-3 py-1 bg-button-dark rounded">Ctrl+R</div>
                                <span className="text-text-secondary">Toggle Recording</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="px-3 py-1 bg-button-dark rounded">Esc</div>
                                <span className="text-text-secondary">Close Help</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="bg-panel-bg rounded-2xl p-4 sm:p-6 shadow-lg border border-border-dark">
                {/* ヘッダー部分 */}
                <div className="flex flex-col md:flex-row gap-1 justify-between items-start md:items-center mb-1 md:mb-2">
                    <div className="bg-dark-bg px-3 py-2 rounded-lg flex items-center gap-2 w-full md:w-auto">
                        <div className="flex flex-col">
                            <h1 className="text-xl font-semibold text-accent">
                                Vibepad
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
                    <div className="bg-dark-bg px-3 py-2 rounded-lg flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                        {/* 楽器選択 (キーの左に移動) */}
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-button-dark border border-border-dark mb-1 flex items-center justify-center shadow-inner relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <select
                                        value={instrument}
                                        onChange={e => setInstrument(e.target.value as InstrumentType)}
                                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                    >
                                        {instrumentOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <span className="text-sm font-bold text-white">{instrumentOptions.find(o => o.value === instrument)?.icon}</span>
                                </div>
                                {/* インジケーターライン */}
                                <div
                                    className="absolute top-1/2 left-1/2 w-1 h-3 bg-accent rounded-full transform -translate-x-1/2 -translate-y-1/2 origin-bottom"
                                    style={{
                                        transform: `translate(-50%, -50%) rotate(${instrumentOptions.findIndex(o => o.value === instrument) * 45}deg)`
                                    }}
                                />
                            </div>
                        </div>

                        {/* ノブ風UIで表示 */}
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-button-dark border border-border-dark mb-1 flex items-center justify-center shadow-inner relative overflow-hidden">
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
                                    className={`absolute top-1/2 left-1/2 w-1 h-3 bg-accent rounded-full transform -translate-x-1/2 -translate-y-1/2 origin-bottom ${animatingKnob === 'key' ? 'knob-rotate' : ''}`}
                                    style={{
                                        transform: `translate(-50%, -50%) rotate(${keys.indexOf(key) * 20}deg)`
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-button-dark border border-border-dark mb-1 flex items-center justify-center shadow-inner relative overflow-hidden">
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
                                    className={`absolute top-1/2 left-1/2 w-1 h-3 bg-button-secondary rounded-full transform -translate-x-1/2 -translate-y-1/2 origin-bottom ${animatingKnob === 'scale' ? 'knob-rotate' : ''}`}
                                    style={{
                                        transform: `translate(-50%, -50%) rotate(${scales.indexOf(scale) * 45}deg)`
                                    }}
                                />
                            </div>
                        </div>

                        {/* テンポコントロール */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-14 h-10 rounded-lg bg-button-dark border border-border-dark mb-1 flex items-center justify-center shadow-inner relative overflow-hidden`}
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
                        </div>
                    </div>
                </div>

                {/* コントロールパネル */}
                <div className="flex flex-col gap-0 mb-1">
                    {/* 再生コントロール */}
                    <div className="bg-dark-bg rounded-t-xl rounded-b-none p-1 sm:p-2 border-b border-border-dark">
                        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                            {/* 主要コントロール - 左側グループ */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={startLoop}
                                    disabled={isLooping || recorded.length === 0}
                                    className="p-2 rounded-lg flex items-center justify-center bg-button-secondary disabled:opacity-40 text-white w-9 h-8"
                                    title="Play"
                                >
                                    {icons.play}
                                </button>
                                <button
                                    onClick={stopLoop}
                                    disabled={!isLooping}
                                    className="p-2 rounded-lg flex items-center justify-center bg-button-dark disabled:opacity-40 text-white w-9 h-8"
                                    title="Stop"
                                >
                                    {icons.stop}
                                </button>
                                <button
                                    onClick={clearRecorded}
                                    disabled={recorded.length === 0}
                                    className="p-2 rounded-lg flex items-center justify-center bg-button-dark disabled:opacity-40 text-white w-9 h-8"
                                    title="Clear"
                                >
                                    {icons.clear}
                                </button>
                                <button
                                    onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                                    className={`p-2 rounded-lg flex items-center justify-center ${showKeyboardHelp ? 'bg-button-secondary' : 'bg-button-dark'} text-white w-9 h-8 hidden sm:flex`}
                                    title="Keyboard Controls"
                                >
                                    {icons.keyboard}
                                </button>
                                <button
                                    onClick={() => setIsAutoPlay(!isAutoPlay)}
                                    className={`p-2 rounded-lg flex items-center justify-center ${isAutoPlay ? 'bg-accent' : 'bg-button-dark'} text-white w-9 h-8`}
                                    title={isAutoPlay ? "Auto Play On" : "Auto Play"}
                                >
                                    {icons.autoPlay}
                                </button>
                                {isAutoPlay && (
                                    <select
                                        value={autoPlayInterval}
                                        onChange={(e) => setAutoPlayInterval(Number(e.target.value))}
                                        className="h-8 px-1 py-0 bg-button-dark text-white text-xs rounded-lg border-0"
                                        title="Change pattern every X measures"
                                    >
                                        <option value="2">2 bars</option>
                                        <option value="4">4 bars</option>
                                        <option value="8">8 bars</option>
                                        <option value="16">16 bars</option>
                                    </select>
                                )}
                            </div>

                            {/* 右側グループ - ユーティリティボタン */}
                            <div className="flex items-center flex-wrap gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={recorded.length === 0}
                                    className="p-2 rounded-lg flex items-center justify-center bg-button-dark disabled:opacity-40 text-white w-9 h-8"
                                    title="Save"
                                >
                                    {icons.save}
                                </button>
                                <button
                                    onClick={handleLoad}
                                    disabled={!hasSaved}
                                    className="p-2 rounded-lg flex items-center justify-center bg-button-dark disabled:opacity-40 text-white w-9 h-8"
                                    title="Load"
                                >
                                    {icons.load}
                                </button>
                                {/* アルペジオコントロール */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            if (isArpMode) {
                                                stopArpeggio();
                                            }
                                            setIsArpMode(!isArpMode);
                                        }}
                                        className={`p-2 ${isArpMode ? 'bg-button-secondary' : 'bg-button-dark'} rounded-lg text-white w-9 h-8 flex items-center justify-center`}
                                        title="Arpeggio"
                                    >
                                        {icons.arp}
                                    </button>
                                    {isArpMode && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    const types: Array<'up' | 'down' | 'updown' | 'random'> = ['up', 'down', 'updown', 'random'];
                                                    const currentIndex = types.indexOf(arpType);
                                                    const nextIndex = (currentIndex + 1) % types.length;
                                                    setArpType(types[nextIndex]);
                                                }}
                                                className="px-2 bg-button-dark text-white text-sm h-8 rounded-lg flex items-center justify-center w-8"
                                                title="Arpeggio Type"
                                            >
                                                {arpTypeLabels[arpType]}
                                            </button>
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-8 rounded-lg bg-button-dark border border-border-dark flex items-center justify-center shadow-inner relative overflow-hidden">
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <select
                                                            value={arpSpeed}
                                                            onChange={e => setArpSpeed(Number(e.target.value))}
                                                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                                            title="Arpeggio Speed"
                                                        >
                                                            {arpSpeedOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                        <span className="text-xs font-medium text-white">
                                                            {arpSpeedOptions.find(opt => opt.value === arpSpeed)?.label || '16th'}
                                                        </span>
                                                    </div>
                                                    {/* インジケーターライン */}
                                                    <div
                                                        className="absolute top-1/2 left-1/2 w-1 h-3 bg-accent rounded-full transform -translate-x-1/2 -translate-y-1/2 origin-bottom"
                                                        style={{
                                                            transform: `translate(-50%, -50%) rotate(${arpSpeedOptions.findIndex(opt => opt.value === arpSpeed) * 45}deg)`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowPatternModal(true)}
                                    className="p-2 rounded-lg flex items-center justify-center bg-button-primary text-white w-9 h-8"
                                    title="Patterns"
                                >
                                    {icons.patterns}
                                </button>
                                <button
                                    onClick={() => setIsRecording(!isRecording)}
                                    className={`p-2 rounded-lg flex items-center justify-center ${isRecording ? 'bg-accent' : 'bg-button-dark'} text-white w-9 h-8`}
                                    title={isRecording ? "Recording" : "Record"}
                                >
                                    {icons.record(isRecording)}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 記録部分 */}
                    <div className="bg-dark-bg rounded-t-none rounded-b-xl p-1 sm:p-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-x-auto flex-1 pl-0">
                                <div className="p-2 rounded-lg flex items-center justify-center text-text-secondary w-9 h-8">
                                    {icons.sequence}
                                </div>
                                <div className="px-3 py-1 bg-pad-inactive rounded text-sm overflow-x-auto whitespace-nowrap flex-1"
                                    style={{
                                        scrollbarWidth: 'none',
                                        msOverflowStyle: 'none',
                                        WebkitOverflowScrolling: 'touch'
                                    }}>
                                    <style jsx>{`
                                        div::-webkit-scrollbar {
                                            display: none;
                                        }
                                    `}</style>
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
                                    className="p-2 rounded-lg flex items-center justify-center bg-button-dark disabled:opacity-40 text-white w-8 h-7"
                                    title="Copy"
                                >
                                    {icons.copy}
                                </button>
                                <button
                                    onClick={handleShare}
                                    disabled={recorded.length === 0}
                                    className="p-2 rounded-lg flex items-center justify-center bg-button-dark disabled:opacity-40 text-white w-8 h-7"
                                    title="Share"
                                >
                                    {icons.share}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* コードパッド グリッド */}
                <div className="bg-dark-bg rounded-xl p-2 sm:p-2 mt-1">
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

                                    {/* キーボードキーを表示 (モバイルでは非表示) */}
                                    <span className="absolute top-1 right-1 text-xs text-text-secondary opacity-60 hidden sm:block">
                                        {getKeyForChord(idx)}
                                    </span>

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
            {renderKeyboardHelp()}
            {renderPatternModal()}
        </div>
    );
} 
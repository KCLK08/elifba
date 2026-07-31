#!/usr/bin/env python3
"""
Split a lesson MP3 into per-card audio files for Elifba Kids.

Detects real speech pauses via RMS analysis and cuts at the midpoint between
silence end and the next speech onset. Output files are named with the app's
audioId convention (e.g. k1-l3-a1-ue2-1.mp3).

Usage:
  python3 scripts/split-lesson-audio.py \\
    --input /path/to/lesson.mp3 \\
    --exercise k1-l3-a1-ue2

  # Manual name list (one audioId per line, order preserved):
  python3 scripts/split-lesson-audio.py --input lesson.mp3 --names names.txt

  # Dry-run (analysis only, no files written):
  python3 scripts/split-lesson-audio.py --input lesson.mp3 --exercise k1-l3-a1-ue2 --dry-run

Requirements: ffmpeg, numpy (stdlib + subprocess otherwise).
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
EXERCISES_DIR = ROOT / "mobile" / "src" / "content" / "exercises"
GENERATED_DIR = EXERCISES_DIR / "generated"


@dataclass
class Segment:
    start_ms: int
    end_ms: int

    @property
    def duration_ms(self) -> int:
        return self.end_ms - self.start_ms


@dataclass
class SplitAnalysis:
    segments: list[Segment]
    split_points_ms: list[int]
    rms: np.ndarray
    frame_ms: float
    silence_threshold: float


def exercise_id_to_filename(exercise_id: str) -> str:
    return exercise_id.replace("-", "_") + ".ts"


def find_exercise_file(exercise_id: str) -> Path | None:
    name = exercise_id_to_filename(exercise_id)
    for folder in (EXERCISES_DIR, GENERATED_DIR):
        path = folder / name
        if path.exists():
            return path
    return None


def load_expected_audio_ids(exercise_id: str) -> list[str]:
    """Read card audioIds from exercise TS; generate {exercise}-{n} when null."""
    path = find_exercise_file(exercise_id)
    if not path:
        raise FileNotFoundError(
            f"No exercise file for {exercise_id!r} under {EXERCISES_DIR}"
        )

    content = path.read_text(encoding="utf-8")
    if "type: 'explanation'" in content:
        raise ValueError(f"Exercise {exercise_id} is an explanation (no card audio).")

    names: list[str] = []
    index = 0
    for line in content.splitlines():
        m = re.search(r'audioId:\s*"([^"]+)"', line)
        if m:
            names.append(m.group(1))
            continue
        if re.search(r"audioId:\s*null", line):
            index += 1
            names.append(f"{exercise_id}-{index}")

    if not names:
        raise ValueError(f"No cards with audioId found in {path}")

    return names


def load_names_file(path: Path) -> list[str]:
    names = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        names.append(line.removesuffix(".mp3"))
    if not names:
        raise ValueError(f"Names file is empty: {path}")
    return names


def decode_mp3_to_mono(path: Path, sample_rate: int = 22050) -> np.ndarray:
    if not shutil.which("ffmpeg"):
        raise RuntimeError("ffmpeg not found on PATH")

    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(path),
        "-ac",
        "1",
        "-ar",
        str(sample_rate),
        "-f",
        "s16le",
        "-",
    ]
    proc = subprocess.run(cmd, capture_output=True, check=False)
    if proc.returncode != 0:
        stderr = proc.stderr.decode("utf-8", errors="replace")
        raise RuntimeError(f"ffmpeg decode failed:\n{stderr}")

    samples = np.frombuffer(proc.stdout, dtype=np.int16).astype(np.float32)
    if samples.size == 0:
        raise RuntimeError("Decoded audio is empty")
    return samples / 32768.0


def compute_rms(samples: np.ndarray, sample_rate: int, frame_ms: float) -> np.ndarray:
    frame_size = max(1, int(sample_rate * frame_ms / 1000.0))
    count = len(samples) // frame_size
    if count == 0:
        raise RuntimeError("Audio too short for analysis")
    trimmed = samples[: count * frame_size].reshape(count, frame_size)
    return np.sqrt(np.mean(trimmed * trimmed, axis=1))


def frames_to_ms(frame: int, frame_ms: float) -> int:
    return int(round(frame * frame_ms))


def ms_to_frame(ms: float, frame_ms: float) -> int:
    return int(ms / frame_ms)


def adaptive_silence_threshold(rms: np.ndarray) -> float:
    """Conservative threshold — prefer fewer cuts over cutting inside speech."""
    floor = float(np.percentile(rms, 15))
    speech = float(np.percentile(rms, 85))
    if speech <= floor * 1.5:
        speech = float(np.max(rms))
    # Midpoint biased toward silence side (stricter = fewer false pauses)
    return floor + (speech - floor) * 0.22


def find_speech_regions(
    rms: np.ndarray,
    threshold: float,
    min_speech_frames: int,
) -> list[tuple[int, int]]:
    voiced = rms >= threshold
    regions: list[tuple[int, int]] = []
    start: int | None = None

    for i, is_voiced in enumerate(voiced):
        if is_voiced and start is None:
            start = i
        elif not is_voiced and start is not None:
            if i - start >= min_speech_frames:
                regions.append((start, i))
            start = None

    if start is not None and len(voiced) - start >= min_speech_frames:
        regions.append((start, len(voiced)))

    return regions


def merge_short_gaps(
    regions: list[tuple[int, int]],
    min_gap_frames: int,
) -> list[tuple[int, int]]:
    if not regions:
        return regions
    merged = [regions[0]]
    for start, end in regions[1:]:
        prev_start, prev_end = merged[-1]
        if start - prev_end < min_gap_frames:
            merged[-1] = (prev_start, end)
        else:
            merged.append((start, end))
    return merged


def detect_segments(
    samples: np.ndarray,
    sample_rate: int = 22050,
    frame_ms: float = 20.0,
    min_silence_ms: float = 450.0,
    min_speech_ms: float = 180.0,
    padding_ms: float = 35.0,
    first_segment_lead_ms: float = 200.0,
) -> SplitAnalysis:
    rms = compute_rms(samples, sample_rate, frame_ms)
    threshold = adaptive_silence_threshold(rms)

    min_speech_frames = max(1, int(min_speech_ms / frame_ms))
    min_gap_frames = max(1, int(min_silence_ms / frame_ms))

    speech_regions = find_speech_regions(rms, threshold, min_speech_frames)
    speech_regions = merge_short_gaps(speech_regions, min_gap_frames)

    if not speech_regions:
        raise RuntimeError("No speech regions detected — adjust thresholds or check input file.")

    total_ms = int(len(samples) / sample_rate * 1000)
    split_points: list[int] = []

    segments: list[Segment] = []
    for i, (start_f, end_f) in enumerate(speech_regions):
        lead_ms = first_segment_lead_ms if i == 0 else padding_ms
        start_ms = max(0, frames_to_ms(start_f, frame_ms) - int(lead_ms))
        end_ms = min(total_ms, frames_to_ms(end_f, frame_ms) + int(padding_ms))

        if i > 0:
            prev_end_f = speech_regions[i - 1][1]
            gap_start_ms = frames_to_ms(prev_end_f, frame_ms)
            gap_end_ms = frames_to_ms(start_f, frame_ms)
            split_ms = int((gap_start_ms + gap_end_ms) / 2)
            split_points.append(split_ms)
            segments[-1] = Segment(segments[-1].start_ms, split_ms)
            start_ms = split_ms

        segments.append(Segment(start_ms, end_ms))

    segments[-1] = Segment(segments[-1].start_ms, total_ms)
    return SplitAnalysis(
        segments=segments,
        split_points_ms=split_points,
        rms=rms,
        frame_ms=frame_ms,
        silence_threshold=threshold,
    )


def export_segment_ffmpeg(
    input_path: Path,
    output_path: Path,
    start_ms: int,
    end_ms: int,
) -> None:
    start_sec = max(0, start_ms / 1000.0)
    duration_sec = max(0.01, (end_ms - start_ms) / 1000.0)
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(input_path),
        "-ss",
        f"{start_sec:.3f}",
        "-t",
        f"{duration_sec:.3f}",
        "-c",
        "copy",
        str(output_path),
    ]
    proc = subprocess.run(cmd, capture_output=True, check=False)
    if proc.returncode != 0:
        # Re-encode if stream copy fails at arbitrary cut points
        cmd_reencode = [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(input_path),
            "-ss",
            f"{start_sec:.3f}",
            "-t",
            f"{duration_sec:.3f}",
            "-q:a",
            "2",
            str(output_path),
        ]
        proc2 = subprocess.run(cmd_reencode, capture_output=True, check=False)
        if proc2.returncode != 0:
            raise RuntimeError(proc2.stderr.decode("utf-8", errors="replace"))


def format_ms(ms: int) -> str:
    sec, milli = divmod(ms, 1000)
    minutes, sec = divmod(sec, 60)
    return f"{minutes:02d}:{sec:02d}.{milli:03d}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Split lesson MP3 into per-card audio files.")
    parser.add_argument("--input", required=True, type=Path, help="Source MP3 file")
    parser.add_argument(
        "--exercise",
        help="Exercise id (e.g. k1-l3-a1-ue2) — loads expected audioIds from content",
    )
    parser.add_argument(
        "--names",
        type=Path,
        help="Text file with one audioId per line (alternative to --exercise)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Output folder (default: <input_stem>_split/ next to source file)",
    )
    parser.add_argument(
        "--min-silence-ms",
        type=float,
        default=450.0,
        help="Minimum pause length to treat as exercise boundary (default: 450)",
    )
    parser.add_argument(
        "--min-speech-ms",
        type=float,
        default=180.0,
        help="Minimum speech length per segment (default: 180)",
    )
    parser.add_argument(
        "--first-segment-lead-ms",
        type=float,
        default=200.0,
        help="Extra lead-in before the first word (default: 200)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Analyse only — print split points, do not write MP3 files",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Write files even when segment count != expected count (NOT recommended)",
    )
    args = parser.parse_args()

    input_path = args.input.expanduser().resolve()
    if not input_path.exists():
        print(f"ERROR: Input file not found: {input_path}", file=sys.stderr)
        return 1

    if not args.exercise and not args.names:
        print("ERROR: Provide --exercise <id> or --names <file.txt>", file=sys.stderr)
        return 1

    try:
        expected_names = (
            load_names_file(args.names)
            if args.names
            else load_expected_audio_ids(args.exercise)
        )
    except (FileNotFoundError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    output_dir = (
        args.output_dir.expanduser().resolve()
        if args.output_dir
        else input_path.parent / f"{input_path.stem}_split"
    )

    print(f"Input:     {input_path}")
    print(f"Exercise:  {args.exercise or '(names file)'}")
    print(f"Expected:  {len(expected_names)} audio files")
    print(f"Output:    {output_dir}{' (dry-run)' if args.dry_run else ''}")
    print()

    samples = decode_mp3_to_mono(input_path)
    analysis = detect_segments(
        samples,
        min_silence_ms=args.min_silence_ms,
        min_speech_ms=args.min_speech_ms,
        first_segment_lead_ms=args.first_segment_lead_ms,
    )
    detected = len(analysis.segments)

    print(f"Silence threshold (RMS): {analysis.silence_threshold:.6f}")
    print(f"Detected segments:     {detected}")
    print(f"Split points ({len(analysis.split_points_ms)}):")
    for i, point in enumerate(analysis.split_points_ms, start=1):
        print(f"  {i:02d}. {format_ms(point)}  ({point} ms)")
    print()

    if detected != len(expected_names):
        print(
            "UNCERTAIN: Detected segment count does not match expected exercise count.\n"
            f"  Detected: {detected}\n"
            f"  Expected: {len(expected_names)}\n"
            "No files were written. Try adjusting --min-silence-ms or inspect the source.\n"
            "Use --dry-run first. Use --force only if you accept manual verification.",
            file=sys.stderr,
        )
        if not args.force or args.dry_run:
            return 2

    if args.dry_run:
        print("Segment preview:")
        for i, (seg, name) in enumerate(zip(analysis.segments, expected_names), start=1):
            print(
                f"  {i:02d}. {name}.mp3  "
                f"{format_ms(seg.start_ms)} – {format_ms(seg.end_ms)}  "
                f"({seg.duration_ms} ms)"
            )
        if detected < len(expected_names):
            print(f"  … missing {len(expected_names) - detected} file(s)")
        elif detected > len(expected_names):
            print(f"  … {detected - len(expected_names)} extra segment(s) ignored")
        return 0

    output_dir.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, object]] = []

    for i, (seg, name) in enumerate(zip(analysis.segments, expected_names), start=1):
        out_file = output_dir / f"{name}.mp3"
        export_segment_ffmpeg(input_path, out_file, seg.start_ms, seg.end_ms)
        manifest.append(
            {
                "index": i,
                "audioId": name,
                "file": out_file.name,
                "start_ms": seg.start_ms,
                "end_ms": seg.end_ms,
                "duration_ms": seg.duration_ms,
            }
        )
        print(
            f"Wrote {out_file.name}  "
            f"({format_ms(seg.start_ms)} – {format_ms(seg.end_ms)})"
        )

    manifest_path = output_dir / "split-manifest.json"
    manifest_path.write_text(
        json.dumps(
            {
                "source": str(input_path),
                "exercise": args.exercise,
                "expected_count": len(expected_names),
                "detected_count": detected,
                "split_points_ms": analysis.split_points_ms,
                "silence_threshold_rms": analysis.silence_threshold,
                "files": manifest,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    print()
    print(f"Done: {len(manifest)} files in {output_dir}")
    print(f"Manifest: {manifest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

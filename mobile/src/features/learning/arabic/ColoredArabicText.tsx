import { useMemo, useState } from 'react';
import { Platform, Text, View, type TextStyle } from 'react-native';
import {
  Canvas,
  Paragraph,
  Skia,
  TextAlign,
  TextDirection,
} from '@shopify/react-native-skia';

import type { ArabicColorRun } from './arabicDisplay';
import { resolveArabicTrainerMetrics } from './arabicTrainerMetrics';

interface ColoredArabicTextProps {
  runs: ArabicColorRun[];
  baseTextStyle: TextStyle;
}

function buildSkiaParagraph(
  runs: ArabicColorRun[],
  fontSize: number,
  lineHeight: number,
  width: number,
) {
  const builder = Skia.ParagraphBuilder.Make({
    textAlign: TextAlign.Center,
    textDirection: TextDirection.RTL,
  });

  const baseStyle = {
    fontSize,
    heightMultiplier: lineHeight / fontSize,
  };

  for (const run of runs) {
    if (!run.text) continue;
    builder.pushStyle({ ...baseStyle, color: Skia.Color(run.color) });
    builder.addText(run.text);
    builder.pop();
  }

  const paragraph = builder.build();
  paragraph.layout(width);
  return paragraph;
}

/** Web: display:contents spans keep cursive shaping across color changes. */
function WebColoredArabicText({ runs, baseTextStyle }: ColoredArabicTextProps) {
  const contentsStyle = { display: 'contents' as const };
  const inkColor = runs[0]?.color;

  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.45}
      style={{ ...baseTextStyle, color: inkColor, alignSelf: 'stretch' }}
    >
      {runs.map((run, index) => (
        <Text
          key={`${index}-${run.text}`}
          style={{ ...baseTextStyle, color: run.color, ...contentsStyle }}
        >
          {run.text}
        </Text>
      ))}
    </Text>
  );
}

function NativeColoredArabicText({ runs, baseTextStyle }: ColoredArabicTextProps) {
  const [width, setWidth] = useState(0);
  const fontSize = typeof baseTextStyle.fontSize === 'number' ? baseTextStyle.fontSize : 64;
  const lineHeight =
    typeof baseTextStyle.lineHeight === 'number'
      ? baseTextStyle.lineHeight
      : resolveArabicTrainerMetrics(fontSize).lineHeight;
  const harakatTopInset =
    typeof baseTextStyle.paddingTop === 'number'
      ? baseTextStyle.paddingTop
      : resolveArabicTrainerMetrics(fontSize).harakatTopInset;

  const paragraph = useMemo(() => {
    if (width <= 0) return null;
    return buildSkiaParagraph(runs, fontSize, lineHeight, width);
  }, [runs, fontSize, lineHeight, width]);

  const paragraphHeight = paragraph ? Math.ceil(paragraph.getHeight()) : lineHeight;
  const height = paragraphHeight + harakatTopInset;

  return (
    <View
      className="w-full"
      style={{ minHeight: height, overflow: 'visible' }}
      onLayout={(event) => {
        const next = Math.floor(event.nativeEvent.layout.width);
        if (next > 0 && next !== width) setWidth(next);
      }}
    >
      {paragraph ? (
        <Canvas style={{ width, height }}>
          <Paragraph paragraph={paragraph} x={0} y={harakatTopInset} width={width} />
        </Canvas>
      ) : null}
    </View>
  );
}

/**
 * Arabic text with multiple colors in one shaping pass — preserves cursive joins
 * in letter groups (لا, هـ ه, connected words).
 */
export function ColoredArabicText(props: ColoredArabicTextProps) {
  if (Platform.OS === 'web') {
    return <WebColoredArabicText {...props} />;
  }
  return <NativeColoredArabicText {...props} />;
}

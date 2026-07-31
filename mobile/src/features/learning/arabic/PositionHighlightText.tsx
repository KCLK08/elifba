import { useMemo, useState } from 'react';
import { Platform, Text, View, type TextStyle } from 'react-native';
import {
  Canvas,
  Paragraph,
  Skia,
  TextAlign,
  TextDirection,
} from '@shopify/react-native-skia';

import { colors } from '@/constants/theme';

import type { PositionHighlightSegments } from './arabicDisplay';

interface PositionHighlightTextProps {
  segments: PositionHighlightSegments;
  baseTextStyle: TextStyle;
  inkColor?: string;
  highlightColor?: string;
}

function buildSkiaParagraph(
  segments: PositionHighlightSegments,
  fontSize: number,
  lineHeight: number,
  inkColor: string,
  highlightColor: string,
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

  const { before, highlight, after } = segments;

  if (before) {
    builder.pushStyle({ ...baseStyle, color: Skia.Color(inkColor) });
    builder.addText(before);
    builder.pop();
  }

  builder.pushStyle({ ...baseStyle, color: Skia.Color(highlightColor) });
  builder.addText(highlight);
  builder.pop();

  if (after) {
    builder.pushStyle({ ...baseStyle, color: Skia.Color(inkColor) });
    builder.addText(after);
    builder.pop();
  }

  const paragraph = builder.build();
  paragraph.layout(width);
  return paragraph;
}

/** Web: nested spans with display:contents preserve cursive joining (PWA parity). */
function WebPositionHighlightText({
  segments,
  baseTextStyle,
  inkColor = colors.ink,
  highlightColor = colors.warning,
}: PositionHighlightTextProps) {
  const contentsStyle = { display: 'contents' as const };

  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.45}
      style={{ ...baseTextStyle, color: inkColor, alignSelf: 'stretch' }}
    >
      {segments.before ? (
        <Text style={{ ...baseTextStyle, color: inkColor, ...contentsStyle }}>
          {segments.before}
        </Text>
      ) : null}
      <Text style={{ ...baseTextStyle, color: highlightColor, ...contentsStyle }}>
        {segments.highlight}
      </Text>
      {segments.after ? (
        <Text style={{ ...baseTextStyle, color: inkColor, ...contentsStyle }}>
          {segments.after}
        </Text>
      ) : null}
    </Text>
  );
}

/** Native: Skia Paragraph shapes the full word once across color spans. */
function NativePositionHighlightText({
  segments,
  baseTextStyle,
  inkColor = colors.ink,
  highlightColor = colors.warning,
}: PositionHighlightTextProps) {
  const [width, setWidth] = useState(0);
  const fontSize = typeof baseTextStyle.fontSize === 'number' ? baseTextStyle.fontSize : 64;
  const lineHeight =
    typeof baseTextStyle.lineHeight === 'number'
      ? baseTextStyle.lineHeight
      : Math.round(fontSize * 1.45);

  const paragraph = useMemo(() => {
    if (width <= 0) return null;
    return buildSkiaParagraph(
      segments,
      fontSize,
      lineHeight,
      inkColor,
      highlightColor,
      width,
    );
  }, [segments, fontSize, lineHeight, inkColor, highlightColor, width]);

  const height = paragraph ? Math.ceil(paragraph.getHeight()) : lineHeight;

  return (
    <View
      className="w-full"
      style={{ minHeight: lineHeight }}
      onLayout={(event) => {
        const next = Math.floor(event.nativeEvent.layout.width);
        if (next > 0 && next !== width) setWidth(next);
      }}
    >
      {paragraph ? (
        <Canvas style={{ width, height }}>
          <Paragraph paragraph={paragraph} x={0} y={0} width={width} />
        </Canvas>
      ) : null}
    </View>
  );
}

/**
 * Highlight one letter inside a connected Arabic word (Lektion 2).
 * Nested RN Text runs break cursive shaping; this keeps one shaping pass.
 */
export function PositionHighlightText(props: PositionHighlightTextProps) {
  if (Platform.OS === 'web') {
    return <WebPositionHighlightText {...props} />;
  }
  return <NativePositionHighlightText {...props} />;
}

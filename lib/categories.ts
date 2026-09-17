import { Category } from './types';

export const CATEGORIES: Category[] = [
  {
    major: '온라인 PC/모바일 게임',
    minors: ['리그오브레전드', '서든어택', '오버워치', '발로란트', '피파온라인'],
    icon: '🎮',
  },
  {
    major: '캐주얼/플래시 게임',
    minors: ['테트리스', '퍼즐', '카드게임', '온라인 보드게임'],
    icon: '🧩',
  },
  {
    major: '오프라인 액티비티',
    minors: ['경도(경찰과 도둑)', '피구', '농구 픽업매치', '축구 픽업매치', '오프라인 보드게임'],
    icon: '🏃',
  },
  {
    major: '오락실/아케이드',
    minors: ['철권', 'DDR/펌프', '인형뽑기 대결', '농구게임기', '기타 아케이드'],
    icon: '🕹️',
  },
  {
    major: '기타/커스텀 배틀',
    minors: ['직접 제안'],
    icon: '⚔️',
  },
];

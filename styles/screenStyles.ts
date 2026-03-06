export const SCREEN_CONTAINER = {
  flex: 1,
  padding: 20,
  paddingTop: 60,
} as const;

export const SCREEN_PADDING = {
  padding: 20,
  paddingTop: 60,
} as const;

import { TYPE } from './typography';

export const SCREEN_TITLE = {
  ...TYPE.h1,
  color: '#FFFFFF',
} as const;

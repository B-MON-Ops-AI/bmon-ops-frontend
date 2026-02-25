'use client';

/**
 * @file StoreProvider.tsx
 * @description Redux 스토어 컨텍스트 프로바이더
 * @module shared/store
 */

import { Provider } from 'react-redux';
import { store } from '@/shared/store/store';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
